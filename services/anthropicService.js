const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateResponse(message, context) {
  try {
    console.log('Generating Anthropic response...');
    console.log('Context length:', context?.length || 0);
    console.log('Message:', message);

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      system: "You are a California Workers' Compensation permanent disability rating expert. Using your knowledge of the California PDRS 2005 edition and AMA Guidelines, analyze medical reports and generate detailed impairment ratings. Pay special attention to WPI ratings, work restrictions, future medical needs, and apportionment determinations.",
      messages: [
        {
          role: "user",
          content: `When analyzing a medical-legal report, extract and summarize the available information in a clear, organized format. If information is missing, reason and think about it. It may be presented in slightly different terminology, but also consider implicit information that can be reasonably inferred from the context. For example, Injurys, impairment, and body part might mean the same thing.

Medical-Legal Report Summary

1. Patient Demographics and Employment Details
Extract any available information about:
- Patient Name
- Age/DOB
- Employer
- Occupation
- Employment Duration
- Insurance Carrier
- Claim Number
- Incident Date
- Current Work Status

2. Injury Claims
Identify any mentioned:
- Type of injury
- Date(s) of injury
- Body parts affected
- Mechanism of injury
- WPI % Rating for each body part

3. Prior Relevant Injuries
If mentioned in the report:
- Date of occurrence
- Description of incident
- Body parts affected
- Treatment received
- Outcome

4. Current Complaints by Body Part
For each affected body part mentioned in the report, note any details about:
- Symptoms
- Pain descriptions
- Impact on activities

5. Clinical Diagnoses
List any diagnoses mentioned in the report

6. Apportionment Determinations
Include if specified in the report:
- Any percentage breakdowns
- Reasoning provided

7. Work Restrictions and Limitations
Note any mentioned restrictions or limitations

8. Future Medical Care Recommendations
List any mentioned:
- Treatment recommendations
- Ongoing care needs

9. Vocational Findings and Recommendations
Include any vocational-related information if present

10. Unique or Notable Aspects
Note any significant information that doesn't fit the above categories

Important Notes:
- Only include information that is explicitly stated in the report
- Mark sections as "Not specified in the report" when information is absent
- Maintain medical terminology as used in the report
- Use "Not provided" or similar neutral language for missing information
- Focus on accuracy over completeness
- Do not use any markdown formatting or asterisks in your response
- Format section titles and text as plain text without any special characters

Present this information in a clear, hierarchical format using plain text headings and bullet points. Maintain medical terminology as used in the report but provide context where needed for understanding.

Important: Identify and include any unique or notable aspects of the report that fall outside these categories but appear significant to the case.

Context:
${context}

User Message:
${message}`
        }
      ],

    });

    console.log('Anthropic response received');
    if (!response.content || response.content.length === 0) {
      throw new Error('Invalid response format from Anthropic API');
    }
    return response.content[0].text;
  } catch (error) {
    console.error('Error generating Anthropic response:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      status: error.status
    });
    throw error;
  }
}

module.exports = { generateResponse };
