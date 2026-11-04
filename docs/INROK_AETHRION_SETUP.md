# AETHRION — Inrok / Kaggle model connection

This integration connects the AETHRION website to the Kaggle-hosted Ollama service and the optional from-scratch AETHRION-LLM API through the authenticated Inrok gateway.

## Back4App configuration

Set the following values on the Back4App Cloud Code deployment for the same application used by Vizyon2026:

- `COLAB_LLAMA_URL`: the Inrok public HTTPS base URL, for example `https://your-name.share.inrok.in`. Do not append `/ollama`, `/llm`, or an API path.
- `COLAB_LLAMA_TOKEN`: the gateway Bearer token printed by the Kaggle notebook. Add this as a **private runtime environment variable / secret**, not as a browser setting and not in a public config JSON.

The backend also accepts the private runtime aliases `AETHRION_GATEWAY_TOKEN` and `OLLAMA_GATEWAY_TOKEN` for the token.

Never place the Bearer token in `index.html`, `app.js`, `aethrion-core.js`, public JSON, or a URL query string.

## Endpoints used by the backend

- Ollama OpenAI-compatible API: `POST {COLAB_LLAMA_URL}/ollama/v1/chat/completions`
- AETHRION-LLM generation API: `POST {COLAB_LLAMA_URL}/llm/generate`
- Public gateway health: `GET {COLAB_LLAMA_URL}/health`

The gateway token is sent server-side by Back4App. The browser never receives it.

## Model selection

The homepage AETHRION AI panel provides:
- Automatic: tries AETHRION-LLM when its trained checkpoint is available, then the Ollama fallback and existing providers.
- AETHRION-LLM: explicitly selects the from-scratch model.
- All 13 configured Ollama model tags.

The response includes `provider` and `model`; the chat UI displays the actual source returned by the backend.

## Important runtime requirements

- The Kaggle notebook session and Inrok tunnel must remain running. Kaggle session resets can change the URL and invalidate the service.
- If the notebook prints a new URL, update `COLAB_LLAMA_URL` in Back4App.
- If the notebook generates a new Bearer token, update the private `COLAB_LLAMA_TOKEN` runtime secret.
- AETHRION-LLM is only available when the notebook has both a trained checkpoint and tokenizer. Importing a dataset or installing the API does not itself train the model. If no checkpoint exists, explicitly selecting AETHRION-LLM returns an unavailable status; automatic mode continues to other providers.
- Ollama model selection requires the corresponding tag to have completed downloading in the current Kaggle session.
