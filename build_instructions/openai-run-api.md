# Create Run API Documentation

**Endpoint**: POST https://api.openai.com/v1/threads/{thread_id}/runs

## Path Parameters

- `thread_id` (Required)
  - Type: string
  - Description: The ID of the thread to run

## Query Parameters

- `include[]` (Optional)
  - Type: array
  - Supported values:
    - `step_details.tool_calls[*].file_search.results[*].content`: Fetches file search result content

## Request Body Parameters

### Core Parameters

#### assistant_id (Required)
- Type: string
- Description: ID of the assistant to execute the run

#### model (Optional)
- Type: string
- Description: Model ID to use for execution
- Note: Overrides the assistant's default model if provided

#### instructions (Optional)
- Type: string or null
- Description: Overrides the assistant's instructions for this run

#### additional_instructions (Optional)
- Type: string or null
- Description: Appends to the assistant's existing instructions

### Message Configuration

#### additional_messages (Optional)
- Type: array or null
- Properties:
  - `role` (Required)
    - Values: "user" or "assistant"
  - `content` (Required)
    - Can be either:
      1. String: Plain text
      2. Array of content parts:
         - Text content
         - Image content (via `image_url` or `image_file`)
  - `attachments` (Optional)
    - `file_id`: ID of attachment
    - `tools`: Array of associated tools

### Tool Configuration

#### tools (Optional)
- Type: array or null
- Available tools:

1. **Code Interpreter**
```json
{
    "type": "code_interpreter"
}
```

2. **File Search**
```json
{
    "type": "file_search",
    "file_search": {
        "max_num_results": 20,
        "ranking_options": {}
    }
}
```

3. **Function**
```json
{
    "type": "function",
    "function": {
        "name": "function_name",
        "description": "Function description",
        "parameters": {},
        "strict": false
    }
}
```

### Execution Parameters

#### temperature (Optional)
- Type: number
- Default: 1
- Range: 0-2
- Description: Controls randomness in output

#### top_p (Optional)
- Type: number
- Default: 1
- Description: Controls nucleus sampling

#### stream (Optional)
- Type: boolean
- Description: Enables server-sent events streaming

#### max_prompt_tokens (Optional)
- Type: integer
- Description: Maximum prompt tokens allowed

#### max_completion_tokens (Optional)
- Type: integer
- Description: Maximum completion tokens allowed

### Advanced Configuration

#### truncation_strategy (Optional)
```json
{
    "type": "auto|last_messages",
    "last_messages": null
}
```

#### tool_choice (Optional)
- Type: string or object
- Values:
  - "none": No tool calls
  - "auto": Model decides
  - "required": Must use tools
  - Object: Specify tool

#### parallel_tool_calls (Optional)
- Type: boolean
- Default: true
- Description: Enables parallel function calling

#### response_format (Optional)
- Type: "auto" or object
- Formats:
  - JSON Schema
  - JSON Object
  - Text
- Note: Compatible with GPT-4 and GPT-3.5 Turbo models

#### metadata (Optional)
- Maximum 16 key-value pairs
- Key length: ≤ 64 characters
- Value length: ≤ 512 characters

## Response

Returns a run object containing the execution details.

## Example Request

```json
{
    "assistant_id": "asst_abc123",
    "model": "gpt-4-turbo-preview",
    "instructions": "Analyze the provided data",
    "tools": [
        {
            "type": "code_interpreter"
        }
    ],
    "metadata": {
        "run_type": "analysis",
        "priority": "high"
    }
}
```