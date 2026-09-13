import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import App from "../../src/App.jsx";

function jsonResponse(body, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal(
    "confirm",
    vi.fn(() => true),
  );
  Element.prototype.scrollIntoView = vi.fn();
});

describe("Ask NeuroThinkHub pilot UI", () => {
  test("shows the pilot and privacy notices and permits an immediate question without selections", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(
      jsonResponse({ reply: "A manageable answer.", answerId: "ans_1" }),
    );
    render(<App />);

    expect(screen.getByText(/pilot providing general guidance/i)).toBeVisible();
    expect(
      screen.getByText(
        /does not diagnose or replace medical, legal, safeguarding or emergency support/i,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        /do not submit names, addresses, medical records or confidential workplace information/i,
      ),
    ).toBeVisible();

    const question = screen.getByRole("textbox", { name: /your question/i });
    expect(question).toBeEnabled();
    await user.type(question, "What could make planning easier?{Enter}");

    await screen.findByText("A manageable answer.");
    const request = JSON.parse(fetch.mock.calls[0][1].body);
    expect(request.question).toBe("What could make planning easier?");
    expect(request.context).toEqual({});
  });

  test("keeps all optional choices visible, changeable and sends them as structured context", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(
      jsonResponse({ reply: "Try this.", answerId: "ans_2" }),
    );
    render(<App />);

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: /who are you seeking support for/i,
      }),
      "learner",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /where is support needed/i }),
      "education",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /how would you like the answer/i }),
      "examples",
    );
    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "How can instructions be clearer?",
    );
    await user.click(screen.getByRole("button", { name: /^send question$/i }));

    await screen.findByText("Try this.");
    const request = JSON.parse(fetch.mock.calls[0][1].body);
    expect(request.context).toEqual({
      supportFor: "learner",
      setting: "education",
      answerStyle: "examples",
    });
    expect(
      screen.getByRole("combobox", {
        name: /who are you seeking support for/i,
      }),
    ).toHaveValue("learner");

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: /who are you seeking support for/i,
      }),
      "team",
    );
    expect(
      screen.getByRole("combobox", {
        name: /who are you seeking support for/i,
      }),
    ).toHaveValue("team");
  });

  test("provides accessible names, text loading status, a polite completion announcement and predictable answer focus", async () => {
    const user = userEvent.setup();
    let finishRequest;
    fetch.mockReturnValueOnce(
      new Promise((resolve) => (finishRequest = resolve)),
    );
    render(<App />);

    expect(
      screen.getByRole("textbox", { name: /your question/i }),
    ).toHaveAttribute("maxlength", "1500");
    expect(
      screen.getByRole("button", { name: /^send question$/i }),
    ).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "Give me one step",
    );
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Preparing your answer",
    );

    await act(async () => {
      finishRequest(
        jsonResponse({
          reply: "Start with a written agenda.",
          answerId: "ans_3",
        }),
      );
    });

    const answer = await screen.findByRole("article", {
      name: /answer from Ask NeuroThinkHub/i,
    });
    await waitFor(() => expect(answer).toHaveFocus());
    expect(
      screen.getByText("Answer ready.", { selector: '[aria-live="polite"]' }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start again/i })).toBeEnabled();
  });

  test("renders response formatting without exposing Markdown symbols", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(
      jsonResponse({
        reply:
          "## Practical steps\n\n1. Choose one task.\n2. Set a short timer.\n\n**Next step:** Start with five minutes.",
        answerId: "ans_formatted",
      }),
    );
    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "How can I begin?{Enter}",
    );

    const answer = await screen.findByRole("article", {
      name: /answer from Ask NeuroThinkHub/i,
    });
    expect(
      within(answer).getByRole("heading", { name: "Practical steps" }),
    ).toBeVisible();
    expect(within(answer).getByRole("list")).toBeVisible();
    expect(within(answer).getByText("Next step:")).toHaveRole("strong");
  });

  test("places accessible feedback controls beneath each answer and submits only minimal feedback by default", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(
        jsonResponse({
          reply: "Use a short checklist.",
          answerId: "ans_feedback",
        }),
      )
      .mockReturnValueOnce(jsonResponse({ recorded: true }));
    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "Help me remember tasks{Enter}",
    );
    const answer = await screen.findByRole("article", {
      name: /answer from Ask NeuroThinkHub/i,
    });
    const feedback = within(answer).getByRole("group", {
      name: /was this answer helpful/i,
    });
    expect(
      within(feedback).getByRole("button", { name: /^helpful$/i }),
    ).toBeEnabled();
    expect(
      within(feedback).getByRole("button", { name: /^partly helpful$/i }),
    ).toBeEnabled();
    expect(
      within(feedback).getByRole("button", { name: /^not helpful$/i }),
    ).toBeEnabled();
    expect(
      within(feedback).getByRole("button", { name: /^report a concern$/i }),
    ).toBeEnabled();

    await user.click(
      within(feedback).getByRole("button", { name: /^helpful$/i }),
    );
    await screen.findByText("Thank you for your feedback.");
    const feedbackRequest = JSON.parse(fetch.mock.calls[1][1].body);
    expect(feedbackRequest).toEqual({
      answerId: "ans_feedback",
      rating: "helpful",
    });
    expect(JSON.stringify(feedbackRequest)).not.toContain(
      "Help me remember tasks",
    );
    expect(JSON.stringify(feedbackRequest)).not.toContain(
      "Use a short checklist",
    );
  });

  test("requires explicit confirmation before Start Again removes the conversation", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(
      jsonResponse({ reply: "One answer.", answerId: "ans_4" }),
    );
    confirm.mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "My question{Enter}",
    );
    await screen.findByText("One answer.");
    await user.click(screen.getByRole("button", { name: /start again/i }));
    expect(screen.getByText("One answer.")).toBeVisible();
    expect(confirm).toHaveBeenCalledWith(
      "Start again and remove this conversation from the screen?",
    );

    await user.click(screen.getByRole("button", { name: /start again/i }));
    expect(screen.queryByText("One answer.")).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /your question/i }),
    ).toHaveFocus();
  });
});
