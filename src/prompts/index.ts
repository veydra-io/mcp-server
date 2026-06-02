/**
 * Veydra MCP Prompts
 * Pre-defined prompt templates for common system dynamics tasks
 */

// Prompt definitions for MCP
export const prompts = [
  {
    name: "analyze_model",
    description:
      "Analyze a system dynamics model to explain its structure, including stocks, flows, feedback loops, and key dynamics.",
    arguments: [
      {
        name: "modelId",
        description: "The ID of the model to analyze",
        required: true,
      },
    ],
  },
  {
    name: "suggest_scenario",
    description:
      "Suggest parameter changes to test a specific policy intervention or explore model behavior.",
    arguments: [
      {
        name: "modelId",
        description: "The ID of the model to create scenarios for",
        required: true,
      },
      {
        name: "goal",
        description:
          "The policy goal or intervention you want to test (e.g., 'reduce infection rate', 'increase economic output')",
        required: true,
      },
    ],
  },
  {
    name: "interpret_results",
    description:
      "Interpret simulation results, identify key insights, trends, and potential policy implications.",
    arguments: [
      {
        name: "modelId",
        description: "The ID of the model that was simulated",
        required: true,
      },
      {
        name: "results",
        description: "The simulation results data to interpret",
        required: true,
      },
    ],
  },
];

/**
 * Get the content for a specific prompt
 */
export function getPrompt(
  name: string,
  args?: Record<string, string>
): { messages: Array<{ role: string; content: { type: string; text: string } }> } {
  switch (name) {
    case "analyze_model":
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Analyze the system dynamics model with ID ${args?.modelId || "[modelId]"}.

Please use the available tools to:
1. First, call get_model to retrieve the model details
2. Then, call get_parameters to understand the adjustable inputs
3. If available, examine the flow diagram structure

Based on this information, provide a comprehensive analysis including:

## Model Overview
- What system does this model represent?
- What is the purpose or question it addresses?

## Structure Analysis
- **Stocks (Accumulations)**: What are the key state variables that accumulate over time?
- **Flows**: What processes change these stocks?
- **Key Parameters**: What inputs can be adjusted?

## Feedback Loops
- Identify any reinforcing (positive) feedback loops
- Identify any balancing (negative) feedback loops
- Explain how these loops drive system behavior

## Dynamic Behavior
- What behavior modes might this model exhibit? (growth, decay, oscillation, S-shaped growth, etc.)
- What are the key leverage points for intervention?

## Limitations
- What assumptions does this model make?
- What aspects of reality might it not capture?`,
            },
          },
        ],
      };

    case "suggest_scenario":
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create scenario suggestions for model ${args?.modelId || "[modelId]"} to achieve the goal: "${args?.goal || "[specify goal]"}".

Please use the available tools to:
1. Call get_model to understand the model context
2. Call get_parameters to see what can be adjusted

Then provide scenario recommendations:

## Understanding the Goal
- How does the stated goal relate to the model's structure?
- Which stocks/flows are most relevant?

## Recommended Scenarios

### Scenario 1: Conservative Approach
- **Parameter Changes**: (specific parameter IDs and values)
- **Rationale**: Why these changes should work
- **Expected Outcome**: What should happen

### Scenario 2: Aggressive Approach  
- **Parameter Changes**: (specific parameter IDs and values)
- **Rationale**: Why these changes should work
- **Expected Outcome**: What should happen

### Scenario 3: Alternative Strategy
- **Parameter Changes**: (specific parameter IDs and values)
- **Rationale**: A different approach to the same goal
- **Expected Outcome**: What should happen

## Comparison Recommendation
Suggest which scenario to run first and what to look for in the results.`,
            },
          },
        ],
      };

    case "interpret_results":
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Interpret the simulation results for model ${args?.modelId || "[modelId]"}.

Results data:
${args?.results || "[simulation results will be provided]"}

Please provide a comprehensive interpretation:

## Summary
- What happened in this simulation?
- What were the key trends?

## Key Findings
1. **Most Important Result**: What stands out?
2. **Unexpected Behaviors**: Anything surprising?
3. **Tipping Points**: Were there any critical thresholds crossed?

## Time Dynamics
- What happened in the short term vs. long term?
- Were there any delays or oscillations?

## Sensitivity Insights
- Which parameters seemed most influential?
- Where are the leverage points?

## Policy Implications
- What actions would improve outcomes?
- What should be avoided?
- What are the trade-offs?

## Recommendations
- What additional scenarios should be explored?
- What questions remain unanswered?`,
            },
          },
        ],
      };

    default:
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Unknown prompt: ${name}`,
            },
          },
        ],
      };
  }
}
