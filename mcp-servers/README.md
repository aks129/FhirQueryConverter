# MCP Servers for Healthcare Demo

This directory contains three MCP (Model Context Protocol) servers that demonstrate a complete clinical care workflow:

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude / AI Agent                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ MCP Protocol
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  CQL Server     │ │  Data Server    │ │  Action Server  │
│  (Specification)│ │  (Analytics)    │ │  (Outreach)     │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ convert_cql_to  │ │ execute_        │ │ send_sms_       │
│ _sql            │ │ databricks_sql  │ │ notification    │
│                 │ │                 │ │                 │
│ validate_cql    │ │ lookup_patient  │ │ get_sent_       │
│                 │ │ _details        │ │ messages        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Databricks    │ │   Firemetrics   │ │     Twilio      │
│   (Analytics)   │ │   (FHIR DB)     │ │     (SMS)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Servers

### 1. cql_mcp_server.py - CQL Converter
**Narrative: CQL is the "specification", SQL is the "assembly code"**

Tools:
- `convert_cql_to_sql`: Converts CQL clinical logic to executable SQL
- `validate_cql`: Validates CQL syntax

### 2. data_mcp_server.py - Data Platform
**Platforms: Databricks (analytics) + Firemetrics (operational)**

Tools:
- `execute_databricks_sql`: Run analytics queries on FHIR data warehouse
- `lookup_patient_details`: Fast patient lookup for contact information

### 3. action_mcp_server.py - Actions
**Platform: Twilio for patient outreach**

Tools:
- `send_sms_notification`: Send SMS to patients
- `get_sent_messages`: Audit trail of sent messages

## Setup

### Install Dependencies
```bash
cd mcp-servers
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file:

```bash
# Databricks (optional - uses mock data if not set)
DATABRICKS_HOST=your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi...
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/...

# Firemetrics (optional - uses mock data if not set)
FIREMETRICS_DB_HOST=your-firemetrics-host
FIREMETRICS_DB_USER=your-user
FIREMETRICS_DB_PASSWORD=your-password

# Twilio (optional - simulates if not set)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```

### Configure Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "cql-converter": {
      "type": "stdio",
      "command": "python",
      "args": ["mcp-servers/cql_mcp_server.py"]
    },
    "data-platform": {
      "type": "stdio",
      "command": "python",
      "args": ["mcp-servers/data_mcp_server.py"]
    },
    "action-server": {
      "type": "stdio",
      "command": "python",
      "args": ["mcp-servers/action_mcp_server.py"]
    }
  }
}
```

## Demo Workflow

1. **Define the logic** (CQL):
   ```
   "Convert this CQL for diabetic patients without HbA1c in 6 months"
   → Uses convert_cql_to_sql → Returns Spark SQL
   ```

2. **Execute the query** (Databricks):
   ```
   "Run this SQL to find patients with care gaps"
   → Uses execute_databricks_sql → Returns patient list with risk scores
   ```

3. **Get contact details** (Firemetrics):
   ```
   "Look up contact info for patient-001"
   → Uses lookup_patient_details → Returns phone, preferred name, language
   ```

4. **Send outreach** (Twilio):
   ```
   "Send Maria a reminder about her HbA1c"
   → Uses send_sms_notification → SMS delivered to patient
   ```

## For Live SMS Demo

To enable live SMS during demo:

1. In `data_mcp_server.py`, update line 30 with your real phone number:
   ```python
   "phone_number": "+1YOUR_REAL_NUMBER",  # Replace this!
   ```

2. Set Twilio environment variables

3. When the AI sends to "patient-001", your phone will receive the SMS!

## Mock Data

Without credentials, all servers use mock data for demo:

- **5 mock patients** with varying risk scores (55-95)
- **Pre-built SQL queries** for diabetes and breast cancer screening
- **Simulated SMS** logged to console

This allows a full demo without any external services configured.
