#!/usr/bin/env python3
"""
Data MCP Server - Databricks and Firemetrics Integration

This server exposes tools for:
1. Executing SQL queries on Databricks (analytics warehouse)
2. Looking up patient details from Firemetrics (fast FHIR database)

The demo shows the complementary nature of these platforms:
- Databricks: Large-scale analytics, measure calculation, risk scoring
- Firemetrics: Fast patient lookups, contact info, operational data
"""

import os
import json
from typing import Optional
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Create the MCP server
server = Server("data-platform")

# Environment variables for credentials
DATABRICKS_HOST = os.environ.get("DATABRICKS_HOST", "")
DATABRICKS_TOKEN = os.environ.get("DATABRICKS_TOKEN", "")
DATABRICKS_WAREHOUSE = os.environ.get("DATABRICKS_WAREHOUSE", "")
DATABRICKS_HTTP_PATH = os.environ.get("DATABRICKS_HTTP_PATH", "")

FIREMETRICS_API_KEY = os.environ.get("FIREMETRICS_API_KEY", "")
FIREMETRICS_DB_HOST = os.environ.get("FIREMETRICS_DB_HOST", "")

# Mock data for demo when credentials aren't available
# NOTE: Replace the phone number below with your real phone number for live SMS demo
MOCK_PATIENTS = [
    {
        "PatientID": "patient-001",
        "patient_name": "Maria Garcia",
        "RiskScore": 95,
        "GapStatus": "CRITICAL",
        "last_hba1c_date": None,
        "glycemic_control": "UNKNOWN",
        "days_overdue": 365,
        "phone_number": "+19176649186",  # Demo: Your real number for live SMS
        "preferred_name": "Maria",
        "preferred_language": "Spanish",
        "best_contact_time": "Evening"
    },
    {
        "PatientID": "patient-002",
        "patient_name": "James Wilson",
        "RiskScore": 88,
        "GapStatus": "HIGH",
        "last_hba1c_date": "2024-03-15",
        "last_hba1c_value": 9.2,
        "glycemic_control": "UNCONTROLLED",
        "days_overdue": 260,
        "phone_number": "+15559876543",
        "preferred_name": "Jim",
        "preferred_language": "English",
        "best_contact_time": "Morning"
    },
    {
        "PatientID": "patient-003",
        "patient_name": "Sarah Johnson",
        "RiskScore": 72,
        "GapStatus": "MODERATE",
        "last_hba1c_date": "2024-06-20",
        "last_hba1c_value": 7.8,
        "glycemic_control": "ABOVE_TARGET",
        "days_overdue": 163,
        "phone_number": "+15551112222",
        "preferred_name": "Sarah",
        "preferred_language": "English",
        "best_contact_time": "Afternoon"
    },
    {
        "PatientID": "patient-004",
        "patient_name": "Robert Chen",
        "RiskScore": 65,
        "GapStatus": "MODERATE",
        "last_hba1c_date": "2024-07-10",
        "last_hba1c_value": 7.4,
        "glycemic_control": "ABOVE_TARGET",
        "days_overdue": 143,
        "phone_number": "+15553334444",
        "preferred_name": "Bob",
        "preferred_language": "English",
        "best_contact_time": "Morning"
    },
    {
        "PatientID": "patient-005",
        "patient_name": "Linda Martinez",
        "RiskScore": 55,
        "GapStatus": "MODERATE",
        "last_hba1c_date": "2024-08-01",
        "last_hba1c_value": 7.1,
        "glycemic_control": "ABOVE_TARGET",
        "days_overdue": 121,
        "phone_number": "+15555556666",
        "preferred_name": "Linda",
        "preferred_language": "Spanish",
        "best_contact_time": "Evening"
    }
]

# Patient details lookup (simulates Firemetrics fast PostgreSQL query)
PATIENT_DETAILS = {p["PatientID"]: p for p in MOCK_PATIENTS}


def execute_databricks_sql_real(sql_query: str) -> dict:
    """Execute SQL on real Databricks connection."""
    try:
        from databricks import sql as databricks_sql

        with databricks_sql.connect(
            server_hostname=DATABRICKS_HOST,
            http_path=DATABRICKS_HTTP_PATH,
            access_token=DATABRICKS_TOKEN
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql_query)
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()

                return {
                    "status": "success",
                    "row_count": len(rows),
                    "columns": columns,
                    "data": [dict(zip(columns, row)) for row in rows]
                }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


def execute_databricks_sql_mock(sql_query: str) -> dict:
    """Return mock data for demo when Databricks credentials aren't available."""
    # Check if this is a patient/risk query
    sql_lower = sql_query.lower()

    if "patient" in sql_lower or "risk" in sql_lower or "gap" in sql_lower:
        # Return mock patient risk data
        return {
            "status": "success",
            "source": "mock_data",
            "note": "Using mock data - set DATABRICKS_* env vars for real connection",
            "row_count": len(MOCK_PATIENTS),
            "columns": ["PatientID", "patient_name", "RiskScore", "GapStatus",
                       "last_hba1c_date", "days_overdue", "glycemic_control"],
            "data": [
                {
                    "PatientID": p["PatientID"],
                    "patient_name": p["patient_name"],
                    "RiskScore": p["RiskScore"],
                    "GapStatus": p["GapStatus"],
                    "last_hba1c_date": p["last_hba1c_date"],
                    "days_overdue": p["days_overdue"],
                    "glycemic_control": p["glycemic_control"]
                }
                for p in MOCK_PATIENTS
            ]
        }
    else:
        # Generic query result
        return {
            "status": "success",
            "source": "mock_data",
            "row_count": 0,
            "columns": [],
            "data": [],
            "message": "Query executed (mock mode - no matching data)"
        }


def lookup_patient_details_real(patient_id: str) -> Optional[dict]:
    """Look up patient details from real Firemetrics PostgreSQL."""
    try:
        import psycopg2

        conn = psycopg2.connect(
            host=FIREMETRICS_DB_HOST,
            database="firemetrics",
            user=os.environ.get("FIREMETRICS_DB_USER", ""),
            password=os.environ.get("FIREMETRICS_DB_PASSWORD", "")
        )

        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    p.id,
                    p.name->0->>'given' AS preferred_name,
                    t.value AS phone_number,
                    COALESCE(
                        p.communication->0->'language'->'coding'->0->>'display',
                        'English'
                    ) AS preferred_language
                FROM patient p
                LEFT JOIN LATERAL (
                    SELECT value
                    FROM jsonb_array_elements(p.telecom) elem
                    WHERE elem->>'system' = 'phone'
                    LIMIT 1
                ) t ON true
                WHERE p.id = %s
            """, (patient_id,))

            row = cursor.fetchone()
            if row:
                return {
                    "patient_id": row[0],
                    "preferred_name": row[1],
                    "phone_number": row[2],
                    "preferred_language": row[3]
                }
            return None

    except Exception as e:
        return {"error": str(e)}


def lookup_patient_details_mock(patient_id: str) -> Optional[dict]:
    """Return mock patient details for demo."""
    patient = PATIENT_DETAILS.get(patient_id)

    if patient:
        return {
            "patient_id": patient["PatientID"],
            "preferred_name": patient["preferred_name"],
            "phone_number": patient["phone_number"],
            "preferred_language": patient["preferred_language"],
            "best_contact_time": patient["best_contact_time"],
            "source": "mock_data"
        }
    return None


@server.list_tools()
async def list_tools():
    """List available tools."""
    return [
        Tool(
            name="execute_databricks_sql",
            description="""Execute a SQL query on Databricks SQL Warehouse.

Use this for analytics queries on FHIR data:
- Quality measure calculations (CMS measures)
- Risk stratification queries
- Population health analytics
- Care gap identification

The Databricks warehouse contains flattened FHIR data in tables like:
- patient, encounter, observation, condition, procedure
- Pre-computed measure views (e.g., cms125_measure_report)

Returns query results with columns and data rows.""",
            inputSchema={
                "type": "object",
                "properties": {
                    "sql_query": {
                        "type": "string",
                        "description": "The SQL query to execute on Databricks"
                    }
                },
                "required": ["sql_query"]
            }
        ),
        Tool(
            name="lookup_patient_details",
            description="""Look up patient contact information from Firemetrics.

Firemetrics provides fast PostgreSQL-based access to FHIR patient data.
Use this to retrieve:
- Patient's preferred name
- Phone number for outreach
- Preferred language for communication
- Best time to contact

This is typically used after identifying patients from a Databricks
analytics query, to get their contact details for care management.""",
            inputSchema={
                "type": "object",
                "properties": {
                    "patient_id": {
                        "type": "string",
                        "description": "The FHIR Patient resource ID"
                    }
                },
                "required": ["patient_id"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    """Handle tool calls."""

    if name == "execute_databricks_sql":
        sql_query = arguments.get("sql_query", "")

        print(f"\n📊 Executing Databricks SQL query...")
        print(f"   Query: {sql_query[:100]}{'...' if len(sql_query) > 100 else ''}")

        # Try real connection first, fall back to mock
        if DATABRICKS_HOST and DATABRICKS_TOKEN:
            result = execute_databricks_sql_real(sql_query)
        else:
            result = execute_databricks_sql_mock(sql_query)

        # Format response
        if result["status"] == "success":
            response = f"""## Databricks Query Results

**Status:** Success
**Rows Returned:** {result['row_count']}
"""
            if result.get("source") == "mock_data":
                response += "**Mode:** Demo (mock data)\n"

            if result["data"]:
                response += "\n### Results:\n\n"
                response += "| " + " | ".join(result["columns"]) + " |\n"
                response += "| " + " | ".join(["---"] * len(result["columns"])) + " |\n"

                for row in result["data"][:10]:  # Limit to 10 rows for display
                    values = [str(row.get(col, "")) for col in result["columns"]]
                    response += "| " + " | ".join(values) + " |\n"

                if result["row_count"] > 10:
                    response += f"\n*...and {result['row_count'] - 10} more rows*\n"

            return [TextContent(type="text", text=response)]
        else:
            return [TextContent(
                type="text",
                text=f"## Query Error\n\n**Error:** {result.get('error', 'Unknown error')}"
            )]

    elif name == "lookup_patient_details":
        patient_id = arguments.get("patient_id", "")

        print(f"\n🔍 Looking up patient details from Firemetrics...")
        print(f"   Patient ID: {patient_id}")

        # Try real connection first, fall back to mock
        if FIREMETRICS_DB_HOST:
            result = lookup_patient_details_real(patient_id)
        else:
            result = lookup_patient_details_mock(patient_id)

        if result:
            if "error" in result:
                return [TextContent(
                    type="text",
                    text=f"## Lookup Error\n\n**Error:** {result['error']}"
                )]

            response = f"""## Patient Details (Firemetrics)

**Patient ID:** {result.get('patient_id', patient_id)}
**Preferred Name:** {result.get('preferred_name', 'N/A')}
**Phone Number:** {result.get('phone_number', 'N/A')}
**Preferred Language:** {result.get('preferred_language', 'English')}
**Best Contact Time:** {result.get('best_contact_time', 'Any time')}
"""
            if result.get("source") == "mock_data":
                response += "\n*Using demo data - set FIREMETRICS_* env vars for real connection*"

            return [TextContent(type="text", text=response)]
        else:
            return [TextContent(
                type="text",
                text=f"## Patient Not Found\n\nNo patient found with ID: {patient_id}"
            )]

    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the MCP server."""
    print("🚀 Starting Data MCP Server (Databricks + Firemetrics)")

    if DATABRICKS_HOST:
        print(f"   Databricks: Connected to {DATABRICKS_HOST}")
    else:
        print("   Databricks: Using mock data (set DATABRICKS_* env vars for real connection)")

    if FIREMETRICS_DB_HOST:
        print(f"   Firemetrics: Connected to {FIREMETRICS_DB_HOST}")
    else:
        print("   Firemetrics: Using mock data (set FIREMETRICS_* env vars for real connection)")

    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
