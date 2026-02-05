thank you very much for your interest in our service!
This service is intended for testing and exploration of the LLM Farm.

It is free of charge and comes with a limited feature set and limited support:
- Accessible models: GPT4o-mini, Gemini 2.0 Flash Lite & text-embedding-3-small
- A limited amount of 6 mio tokens every month.
- No individual support.
- No SLA.
- Not allowed for use in productive systems.
- Limited to 1 subscription/API key per user.

- The service can be canceled at any point in time.

Your credentials
Api key: 7e1bbb4ca1c0477e85813b2df56ffd97
The API key must be send as a custom request header in the following form: genaiplatform-farm-subscription-key=<your-api-key>
The domain is: https://aoai-farm.bosch-temp.com
Your subscription ID (required for the Token Tracking Dashboard): personal-dad1bg-prod

Example
A full URL to GPT 4o mini would look like this:
https://aoai-farm.bosch-temp.com/api/openai/deployments/askbosch-prod-farm-openai-gpt-4o-mini-2024-07-18/chat/completions?api-version=2024-08-01-preview

Documentation, Code Examples & Network Tipps
All available models, some ready to use cURLs, token prices, context windows and more are documented on our Docupedia page.
We also have some code examples to ensure a quick start and in case you would like to use the LLM Farm from an IDE on your laptop or a server located in the Bosch network especially the network tipps might be of interest for you.

Support
Via our Teams channel we inform about new models, new model versions and other important news that are related to the LLM Farm.
Please also use this channel to get support in case of any questions related to the LLM Farm.

Token Tracking Dashboard
With your subscription ID you can track your token consumption via our Token Tracking dashboard: https://bos.ch/llm-farm-reports.
Alternative link: Token Tracking dashboard
You will be granted fresh tokens at the 1st day of every month. Tokens that you have not used will expire by the last day at every month. Once the tokens are exceeded, you won't be charged anything, the service then just responds with a hint that you are out of tokens.

Enterprise Subscription
In case you decide to switch to the paid plan, with the full set of models available as well as unlimited tokens, feel free to reach out to us and we will set up the service for you.

Disclaimer
This developer subscription is financed by G7/PJ-GenAI to spread the knowledge and usage of (Gen)AI in Bosch.
This service and offer for now is limited until end of 2025.
If the service cannot be financed anymore in 2026 all API keys will be deleted at 1st of January 2026.
All customers will be informed beforehand about the future of this service plan.

Again welcome to the LLM Farm and happy prompting 😊



==== Embedings and models =====

Text-Embedding-3-Small with Python OpenAI lib
Kudos to Vuu Van Tong (MS/PJ-EAB-IDEA) for this code contribution!

from openai import OpenAI

client = OpenAI(
    api_key="dummy",
    base_url="https://aoai-farm.bosch-temp.com/api/openai/deployments/askbosch-prod-farm-openai-text-embedding-3-small",
    default_headers = {"genaiplatform-farm-subscription-key": "xxxx"}
)

response = client.embeddings.create(
            input="Why the sky are blue",
            model="askbosch-prod-farm-openai-text-embedding-3-small",
            extra_query={"api-version": "2024-10-21"}
        )
print(response.data[0].embedding)
Take care to use the latest version of the openai lib.


Gemini 2.0 Flash Lite - cURL
You can take and run the following cURL command in the command line of your Windows-based laptop.
Please note that you need to have a local proxy installed as described here: LLM Farm Access & Network Tipps
This cURL assumes that your local proxy listens to port 3128.
(warning) Don't forget to set your API key,

curl -x 127.0.0.1:3128 https://aoai-farm.bosch-temp.com/api/openai/deployments/google-gemini-2-0-flash-lite/chat/completions -H "Content-Type: application/json" -H "genaiplatform-farm-subscription-key: <your-api-key>" -d "{ ""model"": ""gemini-2.0-flash-lite"",""messages"": [ {""role"": ""user"", ""content"": ""Explain to me how AI works in 2 sentences.""}]}"





