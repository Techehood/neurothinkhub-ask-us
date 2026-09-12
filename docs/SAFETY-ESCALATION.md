# Safety and escalation notes

## Scope

Ask NeuroThinkHub provides general guidance. It does not diagnose and does not replace medical, legal, safeguarding or emergency support.

The versioned response policy is `api/_lib/system-prompt.js`. Any policy change must update its version, tests and review record.

## Response boundaries

Responses must use strengths-based, non-clinical language; focus on barriers and practical choices; explain unfamiliar terms; acknowledge uncertainty; include accessibility and safety considerations; and avoid assumptions or diagnosis.

Generated URLs are filtered after generation. Only hosts in `APPROVED_RESOURCE_HOSTS` can remain in the answer. Review that list before each release. A host being allowed does not approve every future page on that host, so periodic content review remains necessary.

## Urgent situations

For immediate danger in the UK, direct the visitor to 999 or A&E. For urgent health advice, direct them to NHS 111. Safeguarding concerns should go to the appropriate safeguarding lead or emergency service. The assistant should encourage prompt human support and should not attempt to assess or manage a crisis itself.

## Concern-report process

1. A designated human reviewer checks concern reports each working day during the pilot.
2. If a report indicates immediate risk, follow the organisation’s safeguarding process; do not rely on the AI response.
3. Pause the pilot if the response policy, resource allow-list or provider behaviour creates a repeated safety risk.
4. Record the decision and corrective action without copying unnecessary conversation content.
5. Test the correction in preview and obtain approval before reopening production access.

## Known limit

Prompt rules and output filtering reduce risk but cannot guarantee every generated answer is complete or appropriate. Human review, visible scope wording and a tested pause procedure remain required throughout the pilot.
