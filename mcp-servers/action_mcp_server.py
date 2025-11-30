#!/usr/bin/env python3
"""
Action MCP Server - Twilio SMS Integration

This server exposes tools for taking action based on analytics results:
- Sending SMS notifications to patients via Twilio

The demo shows the full loop:
1. CQL defines the clinical logic (specification)
2. SQL executes on Databricks (analytics)
3. Firemetrics provides contact details (operational)
4. Twilio sends the outreach message (action)
"""

import os
from datetime import datetime
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Create the MCP server
server = Server("action-server")

# Twilio credentials from environment variables
# Set these in your environment or .env file:
#   TWILIO_ACCOUNT_SID=ACxxxx
#   TWILIO_AUTH_TOKEN=xxxx
#   TWILIO_FROM_NUMBER=+1xxxx
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER", "")

# Track sent messages for demo
SENT_MESSAGES = []


def send_sms_real(phone_number: str, message_body: str) -> dict:
    """Send SMS using real Twilio API."""
    try:
        from twilio.rest import Client

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        message = client.messages.create(
            body=message_body,
            from_=TWILIO_FROM_NUMBER,
            to=phone_number
        )

        return {
            "status": "sent",
            "message_sid": message.sid,
            "to": phone_number,
            "body": message_body,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "to": phone_number
        }


def send_sms_mock(phone_number: str, message_body: str) -> dict:
    """Simulate SMS sending for demo."""
    result = {
        "status": "simulated",
        "message_sid": f"SM_MOCK_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "to": phone_number,
        "body": message_body,
        "timestamp": datetime.now().isoformat(),
        "note": "Demo mode - set TWILIO_* env vars to send real SMS"
    }

    SENT_MESSAGES.append(result)
    return result


@server.list_tools()
async def list_tools():
    """List available tools."""
    return [
        Tool(
            name="send_sms_notification",
            description="""Send an SMS notification to a patient via Twilio.

Use this tool to:
- Send care gap reminders to patients
- Notify patients about overdue screenings
- Send appointment reminders
- Deliver health education messages

The message should be personalized and culturally appropriate.
Consider the patient's preferred language when crafting the message.

Returns confirmation of message delivery or error details.""",
            inputSchema={
                "type": "object",
                "properties": {
                    "phone_number": {
                        "type": "string",
                        "description": "The patient's phone number in E.164 format (e.g., +15551234567)"
                    },
                    "message_body": {
                        "type": "string",
                        "description": "The SMS message content (max 160 chars recommended)"
                    }
                },
                "required": ["phone_number", "message_body"]
            }
        ),
        Tool(
            name="get_sent_messages",
            description="""Get a list of SMS messages sent during this session.

Use this to review what messages have been sent and their status.
Useful for audit trails and confirming outreach completion.""",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    """Handle tool calls."""

    if name == "send_sms_notification":
        phone_number = arguments.get("phone_number", "")
        message_body = arguments.get("message_body", "")

        # Validate inputs
        if not phone_number:
            return [TextContent(
                type="text",
                text="## Error\n\n**Error:** Phone number is required"
            )]

        if not message_body:
            return [TextContent(
                type="text",
                text="## Error\n\n**Error:** Message body is required"
            )]

        # Log the action prominently
        print("\n" + "=" * 60)
        print("📱 SENDING SMS NOTIFICATION")
        print("=" * 60)
        print(f"   To: {phone_number}")
        print(f"   Message: {message_body}")
        print("=" * 60 + "\n")

        # Send via real Twilio or mock
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            result = send_sms_real(phone_number, message_body)
        else:
            result = send_sms_mock(phone_number, message_body)

        # Format response
        if result["status"] in ["sent", "simulated"]:
            mode = "Live" if result["status"] == "sent" else "Demo"
            response = f"""## SMS Notification Sent ✅

**Mode:** {mode}
**To:** {result['to']}
**Message SID:** {result['message_sid']}
**Timestamp:** {result['timestamp']}

### Message Content:
> {result['body']}
"""
            if result.get("note"):
                response += f"\n*{result['note']}*"

            print(f"✅ SMS {'sent' if result['status'] == 'sent' else 'simulated'} successfully!")

            return [TextContent(type="text", text=response)]
        else:
            print(f"❌ SMS failed: {result.get('error', 'Unknown error')}")

            return [TextContent(
                type="text",
                text=f"""## SMS Failed ❌

**To:** {result['to']}
**Error:** {result.get('error', 'Unknown error')}

Please check:
1. Phone number format (should be +1XXXXXXXXXX)
2. Twilio credentials are valid
3. Twilio account has sufficient balance
"""
            )]

    elif name == "get_sent_messages":
        if not SENT_MESSAGES:
            return [TextContent(
                type="text",
                text="## Sent Messages\n\nNo messages have been sent in this session."
            )]

        response = f"## Sent Messages ({len(SENT_MESSAGES)} total)\n\n"

        for i, msg in enumerate(SENT_MESSAGES, 1):
            response += f"""### Message {i}
- **To:** {msg['to']}
- **Status:** {msg['status']}
- **Time:** {msg['timestamp']}
- **Content:** {msg['body'][:50]}{'...' if len(msg['body']) > 50 else ''}

"""

        return [TextContent(type="text", text=response)]

    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the MCP server."""
    print("🚀 Starting Action MCP Server (Twilio SMS)")

    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        print(f"   Twilio: Connected (From: {TWILIO_FROM_NUMBER})")
    else:
        print("   Twilio: Demo mode (set TWILIO_* env vars for real SMS)")
        print("   Required env vars:")
        print("     - TWILIO_ACCOUNT_SID")
        print("     - TWILIO_AUTH_TOKEN")
        print("     - TWILIO_FROM_NUMBER")

    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
