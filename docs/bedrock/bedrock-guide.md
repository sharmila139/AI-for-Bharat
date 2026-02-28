# Amazon Bedrock Integration Guide

Complete guide for integrating Amazon Bedrock into RuralConnect AI.

## Overview

Amazon Bedrock provides access to foundation models from leading AI companies through a single API. RuralConnect AI uses Bedrock for:

1. **Conversational AI**: Natural language understanding and generation
2. **RAG (Retrieval Augmented Generation)**: Knowledge base queries
3. **Multi-language Support**: Translation and localization
4. **Content Generation**: Automated responses and recommendations

## Models Used

### Claude 3 Sonnet
- **Use Case**: Complex reasoning, multi-turn conversations
- **Context Window**: 200K tokens
- **Strengths**: Nuanced understanding, detailed responses
- **Cost**: $3/1M input tokens, $15/1M output tokens
- **When to use**: Agriculture advice, health assessments, education content

### Claude 3 Haiku
- **Use Case**: Fast responses, simple queries
- **Context Window**: 200K tokens
- **Strengths**: Speed, cost-effective
- **Cost**: $0.25/1M input tokens, $1.25/1M output tokens
- **When to use**: Quick lookups, simple Q&A, navigation help

### Amazon Titan Text Express
- **Use Case**: Text generation, summarization
- **Context Window**: 8K tokens
- **Strengths**: AWS-native, reliable
- **Cost**: $0.20/1M input tokens, $0.60/1M output tokens
- **When to use**: Content summarization, simple text generation

### Amazon Titan Embeddings
- **Use Case**: Vector embeddings for RAG
- **Dimensions**: 1536
- **Cost**: $0.10/1M tokens
- **When to use**: Knowledge base search, semantic similarity

## Setup Steps

### 1. Enable Bedrock

```bash
cd infrastructure/aws/bedrock
./enable-bedrock.sh
```

Follow the interactive prompts to:
- Request model access through AWS Console
- Verify access to required models
- Configure environment variables

### 2. Request Model Access

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock)
2. Navigate to "Model access"
3. Click "Request model access"
4. Select required models:
   - ☑ Anthropic Claude 3 Sonnet
   - ☑ Anthropic Claude 3 Haiku
   - ☑ Amazon Titan Text G1 - Express
   - ☑ Amazon Titan Embeddings G1 - Text
5. Submit request
6. Wait for approval (1-2 hours)

### 3. Verify Access

```bash
# Test Claude 3 Sonnet
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
  --cli-binary-format raw-in-base64-out \
  output.json

# Check response
cat output.json | jq .
```

## Integration Patterns

### Pattern 1: Simple Text Generation

```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

async function generateText(prompt: string) {
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}
```

### Pattern 2: Streaming Responses

```typescript
import { InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

async function streamText(prompt: string) {
  const command = new InvokeModelWithResponseStreamCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const response = await client.send(command);
  
  for await (const event of response.body) {
    if (event.chunk) {
      const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
      if (chunk.type === 'content_block_delta') {
        process.stdout.write(chunk.delta.text);
      }
    }
  }
}
```

### Pattern 3: RAG with Embeddings

```typescript
async function generateEmbedding(text: string) {
  const command = new InvokeModelCommand({
    modelId: 'amazon.titan-embed-text-v1',
    body: JSON.stringify({
      inputText: text
    })
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.embedding; // 1536-dimensional vector
}

async function ragQuery(query: string, knowledgeBase: string[]) {
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Find similar documents (using vector similarity)
  const relevantDocs = findSimilarDocuments(queryEmbedding, knowledgeBase);
  
  // 3. Generate response with context
  const prompt = `Context: ${relevantDocs.join('\n\n')}
  
Question: ${query}

Answer based on the context provided:`;

  return await generateText(prompt);
}
```

### Pattern 4: Multi-turn Conversation

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

async function chat(messages: Message[]) {
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      messages: messages
    })
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}
```

## Cost Optimization

### 1. Model Selection Strategy

```typescript
function selectModel(queryComplexity: 'simple' | 'complex') {
  if (queryComplexity === 'simple') {
    return 'anthropic.claude-3-haiku-20240307-v1:0'; // 10x cheaper
  }
  return 'anthropic.claude-3-sonnet-20240229-v1:0'; // Better quality
}
```

### 2. Response Caching

```typescript
import { createHash } from 'crypto';

const cache = new Map<string, string>();

async function cachedGenerate(prompt: string) {
  const key = createHash('sha256').update(prompt).digest('hex');
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const response = await generateText(prompt);
  cache.set(key, response);
  return response;
}
```

### 3. Token Limiting

```typescript
function truncatePrompt(text: string, maxTokens: number = 1000) {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  return text.slice(0, maxChars);
}
```

### 4. Batch Processing

```typescript
async function batchGenerate(prompts: string[]) {
  // Process in parallel with concurrency limit
  const results = [];
  const batchSize = 5;
  
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(prompt => generateText(prompt))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## Monitoring and Logging

### CloudWatch Metrics

```typescript
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

async function logBedrockUsage(modelId: string, inputTokens: number, outputTokens: number) {
  const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });
  
  await cloudwatch.send(new PutMetricDataCommand({
    Namespace: 'RuralConnect/Bedrock',
    MetricData: [
      {
        MetricName: 'InputTokens',
        Value: inputTokens,
        Unit: 'Count',
        Dimensions: [{ Name: 'ModelId', Value: modelId }]
      },
      {
        MetricName: 'OutputTokens',
        Value: outputTokens,
        Unit: 'Count',
        Dimensions: [{ Name: 'ModelId', Value: modelId }]
      }
    ]
  }));
}
```

## Error Handling

```typescript
async function safeGenerate(prompt: string, retries: number = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateText(prompt);
    } catch (error) {
      if (error.name === 'ThrottlingException') {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      
      if (error.name === 'ModelNotReadyException') {
        throw new Error('Model access not yet approved');
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Best Practices

1. **Use appropriate models**: Haiku for simple tasks, Sonnet for complex reasoning
2. **Implement caching**: Cache repeated queries to reduce costs
3. **Set token limits**: Prevent runaway costs with max_tokens
4. **Handle errors gracefully**: Implement retry logic with exponential backoff
5. **Monitor usage**: Track token consumption and costs
6. **Optimize prompts**: Clear, concise prompts reduce token usage
7. **Use streaming**: For better UX in conversational interfaces
8. **Implement fallbacks**: Have offline/cached responses ready

## Security Considerations

1. **IAM Permissions**: Use least privilege for Bedrock access
2. **Input Validation**: Sanitize user inputs before sending to Bedrock
3. **Output Filtering**: Filter sensitive information from responses
4. **Rate Limiting**: Prevent abuse with per-user rate limits
5. **Audit Logging**: Log all Bedrock invocations for compliance

## Troubleshooting

### Issue: "AccessDeniedException"
**Solution**: Ensure IAM role has `bedrock:InvokeModel` permission

### Issue: "ModelNotReadyException"
**Solution**: Model access request is pending approval

### Issue: "ThrottlingException"
**Solution**: Implement exponential backoff and retry logic

### Issue: High costs
**Solution**: Use Haiku for simple queries, implement caching, set token limits

## Next Steps

1. Implement Bedrock client wrapper (task 3.2)
2. Set up RAG workflow (task 3.4)
3. Configure Bedrock Agents (task 3.5)
4. Create prompt templates (task 3.6)
5. Implement token tracking (task 3.7)
