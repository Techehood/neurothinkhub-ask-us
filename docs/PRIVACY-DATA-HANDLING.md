# Privacy and data-handling notes

## Data minimisation

The application asks for a question plus three optional context choices. It does not ask for a name, diagnosis, address, medical record or employer. The visitor is warned not to submit personal or confidential information.

## Chat data

| Data                                          | Why                                                | Where                                            | Retention                                                                         | Deletion                                                            |
| --------------------------------------------- | -------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Current on-screen conversation                | Provide follow-up context and display the exchange | Browser memory                                   | Until refresh, tab close or confirmed Start Again                                 | Refresh, close the tab, or select Start Again and confirm           |
| Question, recent history and optional choices | Generate the requested answer                      | Sent directly from the server route to Anthropic | Governed by NeuroThinkHub’s Anthropic account terms and data-processing agreement | Use the account/provider deletion process defined in that agreement |
| Server application copy of raw chat           | Not required                                       | Not created by this application                  | None                                                                              | Not applicable                                                      |

The route sends at most the eight most recent valid messages plus the current question. It sets `Cache-Control: no-store` and does not log request or response content.

## Feedback data

Default feedback contains only:

- answer identifier;
- rating;
- recording timestamp;
- deletion deadline.

A concern may also contain up to 500 characters supplied by the visitor. The complete on-screen conversation is attached only when the visitor explicitly ticks the consent box. IP address and session identifier are not included in the feedback event.

Feedback is written server-to-server to Upstash Redis using `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The application does not write feedback contents to runtime logs. Before opening the pilot, the operator must ensure the integration:

1. is connected only to this Vercel project;
2. restricts access to authorised reviewers;
3. automatically expires each record after no more than 30 days;
4. can locate and delete a record by answer identifier; and
5. has an approved privacy notice and data-processing agreement.

If the destination cannot enforce these controls, leave feedback unavailable and do not open the pilot to the public.

## Deletion request

Ask the visitor for the answer identifier only—never ask them to resend the conversation. In Upstash, scan for `feedback:<answerId>:*`, delete each matching key and any explicitly consented attachment, then record only that the deletion request was completed. Provider-side deletion follows the applicable Anthropic account agreement.

## Existing data

This change does not migrate, alter or delete any existing data. The previous application held the conversation in browser state and sent recent messages to the provider; no application database was present in the repository.
