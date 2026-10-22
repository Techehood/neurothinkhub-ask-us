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
  window.history.replaceState(null, "", "/");
});

describe("Ask NeuroThinkHub pilot UI", () => {
  test("shows the guidance and privacy notices and permits an immediate question without selections", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(
      jsonResponse({ reply: "A manageable answer.", answerId: "ans_1" }),
    );
    render(<App />);

    expect(
      screen.getByText(/ask neurothinkhub provides general guidance/i),
    ).toBeVisible();
    expect(screen.queryByText(/\bpilot\b/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Explore all topics" }),
    ).toHaveAttribute("href", "https://neurothinkhub.com/spectrum-grid/");
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

  test("keeps the audience choice changeable and sends it as structured context", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(
      jsonResponse({ reply: "Try this.", answerId: "ans_2" }),
    );
    render(<App />);

    await user.click(screen.getByRole("radio", { name: "an educator" }));
    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "How can instructions be clearer?",
    );
    await user.click(screen.getByRole("button", { name: /^send message$/i }));

    await screen.findByText("Try this.");
    const request = JSON.parse(fetch.mock.calls[0][1].body);
    expect(request.context).toEqual({ persona: "educator" });
    expect(screen.getByRole("radio", { name: "an educator" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "a manager" }));
    expect(screen.getByRole("radio", { name: "a manager" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "an educator" }),
    ).not.toBeChecked();
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
    ).toHaveAttribute("maxlength", "500");
    expect(
      screen.getByRole("button", { name: /^send message$/i }),
    ).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "Give me one step",
    );
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Preparing a calm, structured response",
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
    expect(
      screen.getByRole("button", { name: /start a blank conversation/i }),
    ).toBeEnabled();
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

  test("requires explicit confirmation before Start a blank conversation removes the conversation", async () => {
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
    await user.click(
      screen.getByRole("button", { name: /start a blank conversation/i }),
    );
    expect(screen.getByText("One answer.")).toBeVisible();
    expect(confirm).toHaveBeenCalledWith(
      "Clear this conversation and start fresh? Your current chat will be lost.",
    );

    await user.click(
      screen.getByRole("button", { name: /start a blank conversation/i }),
    );
    expect(screen.queryByText("One answer.")).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /your question/i }),
    ).toHaveFocus();
  });

  test("shows the mic button with a message when the browser has no voice input", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /speak your question/i }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Voice input works in Chrome and Edge",
    );
  });

  test("explains when the microphone is blocked instead of failing silently", async () => {
    const user = userEvent.setup();
    class BlockedRecognition {
      start() {
        setTimeout(() => this.onerror({ error: "not-allowed" }), 0);
      }
      stop() {}
    }
    vi.stubGlobal("webkitSpeechRecognition", BlockedRecognition);
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: /speak your question/i }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "The microphone is blocked",
    );
    expect(
      screen.getByRole("button", { name: /speak your question/i }),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
  test("sends a valid ?pattern= key with each question", async () => {
    window.history.replaceState(null, "", "/?pattern=Sensory");
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(jsonResponse({ reply: "First.", answerId: "a1" }))
      .mockReturnValueOnce(jsonResponse({ reply: "Second.", answerId: "a2" }));
    render(<App />);

    const question = screen.getByRole("textbox", { name: /your question/i });
    await user.type(question, "One{Enter}");
    await screen.findByText("First.");
    await user.type(question, "Two{Enter}");
    await screen.findByText("Second.");

    expect(JSON.parse(fetch.mock.calls[0][1].body).patternKey).toBe("sensory");
    expect(JSON.parse(fetch.mock.calls[1][1].body).patternKey).toBe("sensory");
  });

  test.each(["/", "/?pattern=unknown", "/?pattern=", "/?pattern=a&pattern=b"])(
    "sends no pattern key for %s",
    async (url) => {
      window.history.replaceState(null, "", url);
      const user = userEvent.setup();
      fetch.mockReturnValueOnce(jsonResponse({ reply: "Ok.", answerId: "a" }));
      render(<App />);

      await user.type(
        screen.getByRole("textbox", { name: /your question/i }),
        "Hello{Enter}",
      );
      await screen.findByText("Ok.");

      expect(JSON.parse(fetch.mock.calls[0][1].body)).not.toHaveProperty(
        "patternKey",
      );
    },
  );

  test("keeps the draft in the text box when a request fails", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(
      jsonResponse({ error: "Temporarily unavailable." }, false),
    );
    render(<App />);

    const question = screen.getByRole("textbox", { name: /your question/i });
    await user.type(question, "My unsaved thoughts{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Temporarily unavailable. Your draft is still in the text box below so you will not lose your thoughts.",
    );
    expect(question).toHaveValue("My unsaved thoughts");
    expect(
      screen.queryAllByText("My unsaved thoughts", {
        selector: ".user-message",
      }),
    ).toHaveLength(0);
  });
  test("pre-fills the seed prompt from ?pattern= with an editable cue that clears on typing", async () => {
    window.history.replaceState(null, "", "/?pattern=translator");
    const user = userEvent.setup();
    render(<App />);

    const question = screen.getByRole("textbox", { name: /your question/i });
    expect(question).toHaveValue(
      "My thoughts are rough: [paste or type here]. Help me shape them without losing my voice.",
    );
    expect(question).toHaveClass("is-prefilled");
    expect(question).toHaveAccessibleDescription(/editable starter prompt/i);
    expect(screen.getByRole("status")).toHaveTextContent(
      /shaping responses for: the creative translator/i,
    );
    expect(
      screen.getByRole("button", { name: /the creative translator/i }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.type(question, "!");
    expect(question).not.toHaveClass("is-prefilled");
    expect(screen.queryByText(/editable starter prompt/i)).toBeNull();
  });

  test("selecting a pattern pill swaps an untouched seed but never overwrites the visitor's own text", async () => {
    const user = userEvent.setup();
    render(<App />);
    const question = screen.getByRole("textbox", { name: /your question/i });

    await user.click(
      screen.getByRole("button", { name: /sensory-sensitive/i }),
    );
    expect(question.value).toMatch(/^Everything feels like too much/);

    await user.click(
      screen.getByRole("button", { name: /masking professional/i }),
    );
    expect(question.value).toMatch(/^I need to work out how to say/);

    await user.clear(question);
    await user.type(question, "My own words");
    await user.click(screen.getByRole("button", { name: /scaffolder/i }));
    expect(question).toHaveValue("My own words");
    expect(screen.getByRole("button", { name: /scaffolder/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("Switch to blank chat clears the pattern but keeps the conversation", async () => {
    window.history.replaceState(null, "", "/?pattern=masking");
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(jsonResponse({ reply: "Option A.", answerId: "a1" }))
      .mockReturnValueOnce(jsonResponse({ reply: "Plain.", answerId: "a2" }));
    render(<App />);
    const question = screen.getByRole("textbox", { name: /your question/i });

    await user.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText("Option A.");
    await user.click(
      screen.getByRole("button", { name: /switch to blank chat/i }),
    );

    expect(screen.getByText("Option A.")).toBeVisible();
    expect(screen.queryByText(/shaping responses for/i)).toBeNull();
    expect(question).toHaveFocus();

    await user.type(question, "Follow-up{Enter}");
    await screen.findByText("Plain.");
    expect(JSON.parse(fetch.mock.calls[0][1].body).patternKey).toBe("masking");
    expect(JSON.parse(fetch.mock.calls[1][1].body)).not.toHaveProperty(
      "patternKey",
    );
  });

  test("Start a blank conversation clears the pattern and conversation, asking first only when there is a chat", async () => {
    window.history.replaceState(null, "", "/?pattern=scaffolder");
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(
      jsonResponse({ reply: "Stage 1.", answerId: "a" }),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText("Stage 1.");
    await user.click(
      screen.getByRole("button", { name: /start a blank conversation/i }),
    );

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Stage 1.")).toBeNull();
    expect(screen.queryByText(/shaping responses for/i)).toBeNull();
    expect(screen.getByRole("textbox", { name: /your question/i })).toHaveValue(
      "",
    );
    // The escape hatch stays visible so a visitor can always start fresh.
    expect(
      screen.getByRole("button", { name: /start a blank conversation/i }),
    ).toBeInTheDocument();

    confirm.mockClear();
    await user.click(
      screen.getByRole("button", { name: /sensory-sensitive/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /start a blank conversation/i }),
    );
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.queryByText(/shaping responses for/i)).toBeNull();
  });
  test("shows suggested questions only while the chat and input are both empty", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(jsonResponse({ reply: "Done.", answerId: "a" }));
    render(<App />);
    const starter = () =>
      screen.queryByRole("button", {
        name: "What could make it easier to start a difficult task?",
      });
    const question = screen.getByRole("textbox", { name: /your question/i });

    expect(starter()).toBeVisible();
    await user.type(question, "Hi");
    expect(starter()).toBeNull();
    await user.clear(question);
    expect(starter()).toBeVisible();
    await user.type(question, "Hi{Enter}");
    await screen.findByText("Done.");
    expect(starter()).toBeNull();
  });

  test("hides suggested questions when a pattern pre-fills the input", () => {
    window.history.replaceState(null, "", "/?pattern=sensory");
    render(<App />);
    expect(screen.queryByText(/try one of these/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("This space adapts to your pattern of need."),
    ).toBeVisible();
  });
  test("blank chat shows the audience choice and mic but no steps or preference dropdowns", () => {
    render(<App />);
    expect(screen.getByRole("radiogroup", { name: "I am…" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: /speak your question/i }),
    ).toBeVisible();
    expect(screen.queryByText(/optional preferences/i)).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText(/share who you are/i)).toBeNull();
  });

  test("an active pattern stacks with the chosen role and topic and sends all three", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(jsonResponse({ reply: "Calm.", answerId: "a" }));
    render(<App />);

    await user.click(screen.getByRole("radio", { name: "a manager" }));
    await user.click(screen.getByRole("radio", { name: "ADHD" }));
    await user.click(
      screen.getByRole("button", { name: /sensory-sensitive/i }),
    );
    expect(
      screen.getByRole("radiogroup", { name: "I am…" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /speak your question/i }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText("Calm.");
    const request = JSON.parse(fetch.mock.calls[0][1].body);
    expect(request.context).toEqual({ persona: "manager" });
    expect(request.patternKey).toBe("sensory");
    expect(request.topicKey).toBe("adhd");
  });

  test("copies the full answer and confirms for two seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const reply = "Variant 1: Lightly structured\nWhat changed: shorter lines.";
    fetch.mockReturnValueOnce(jsonResponse({ reply, answerId: "a" }));
    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "Shape this{Enter}",
    );
    const copy = await screen.findByRole("button", {
      name: "Copy response to clipboard",
    });
    expect(copy).toHaveTextContent("Copy");

    await user.click(copy);
    expect(await navigator.clipboard.readText()).toBe(reply);
    expect(copy).toHaveTextContent("Copied ✓");
    expect(screen.getByText("Response copied.")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(copy).toHaveTextContent(/^Copy$/);
    vi.useRealTimers();
  });

  test("falls back to selection copy when the Clipboard API is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("blocked in iframe"),
    );
    document.execCommand = vi.fn(() => true);
    fetch.mockReturnValueOnce(
      jsonResponse({ reply: "Option A.", answerId: "a" }),
    );
    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "Draft{Enter}",
    );
    await user.click(
      await screen.findByRole("button", { name: "Copy response to clipboard" }),
    );

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(
      screen.getByRole("button", { name: "Copy response to clipboard" }),
    ).toHaveTextContent("Copied ✓");
  });
  test("pattern buttons announce the driver and title as separate words", () => {
    render(<App />);
    expect(
      screen.getByRole("button", {
        name: "Clarity The Executive Function Scaffolder",
      }),
    ).toBeInTheDocument();
  });

  test("announces what each column does and shows every subtitle", () => {
    render(<App />);
    expect(screen.getByText("Ask about a condition")).toBeVisible();
    expect(screen.getByText("Describe what's happening")).toBeVisible();
    expect(screen.getByText("Tell us who's asking")).toBeVisible();
    expect(
      screen.getByText("Topics column, sets condition context"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Patterns column, opens Ask conversation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("I am… column, sets role context"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/support options/i)).toBeNull();
  });

  test("shows the four CRAA categories with their pick-this-when text", () => {
    render(<App />);
    for (const tag of ["Clarity", "Regulation", "Authenticity", "Agency"]) {
      expect(
        screen.getByRole("button", { name: new RegExp(`^${tag} The `) }),
      ).toBeInTheDocument();
    }
    expect(screen.getByText(/^Pick this when a task feels huge/)).toBeVisible();
  });

  test("topics are pick-one and Just ask clears the topic", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("radio", { name: "ADHD" }));
    await user.click(screen.getByRole("radio", { name: "Dyslexia" }));
    expect(screen.getByRole("radio", { name: "Dyslexia" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "ADHD" })).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Just ask" }));
    expect(screen.getByRole("radio", { name: "Dyslexia" })).not.toBeChecked();
    expect(
      screen.getByRole("textbox", { name: /your question/i }),
    ).toHaveFocus();
  });

  test("a topic and role change the suggested prompts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("radio", { name: "a parent or family member" }),
    );
    await user.click(screen.getByRole("radio", { name: "ADHD" }));
    expect(
      screen.getByRole("button", { name: "What helps at home with ADHD?" }),
    ).toBeVisible();
  });

  test("exploring is a real choice that sends no role", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(jsonResponse({ reply: "Ok.", answerId: "a" }));
    render(<App />);

    await user.click(screen.getByRole("radio", { name: /exploring/i }));
    await user.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "Hello{Enter}",
    );
    await screen.findByText("Ok.");
    expect(JSON.parse(fetch.mock.calls[0][1].body).context).toEqual({});
  });

  test("?topic= and ?role= preload together without sending anything", async () => {
    window.history.replaceState(null, "", "/?topic=adhd&role=parent");
    render(<App />);

    expect(screen.getByRole("radio", { name: "ADHD" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "a parent or family member" }),
    ).toBeChecked();
    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "What helps at home with ADHD?" }),
    ).toBeVisible();
  });

  test("a condition role id also sets the matching topic, and an explicit topic wins", () => {
    window.history.replaceState(null, "", "/?role=adhd");
    const { unmount } = render(<App />);
    expect(screen.getByRole("radio", { name: "ADHD" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "a neurodivergent person" }),
    ).toBeChecked();
    unmount();

    window.history.replaceState(null, "", "/?role=adhd&topic=dyslexia");
    render(<App />);
    expect(screen.getByRole("radio", { name: "Dyslexia" })).toBeChecked();
  });

  test("?pattern= accepts the CRAA ids and ?question= only pre-fills", () => {
    window.history.replaceState(
      null,
      "",
      "/?pattern=regulation&question=Too%20loud%20at%20work",
    );
    render(<App />);

    expect(screen.getByText(/shaping responses for/i)).toHaveTextContent(
      "The Sensory-Sensitive Worker",
    );
    expect(screen.getByRole("textbox", { name: /your question/i })).toHaveValue(
      "Too loud at work",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  test("unknown or unsafe parameters are ignored and the app starts blank", () => {
    window.history.replaceState(
      null,
      "",
      "/?topic=__proto__&role=admin&pattern=drop;table",
    );
    render(<App />);

    expect(screen.getByRole("textbox", { name: /your question/i })).toHaveValue(
      "",
    );
    expect(screen.queryByText(/shaping responses for/i)).toBeNull();
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  test("the character counter turns amber at 400 and terracotta at 480, with a gentle stop at 500", async () => {
    const user = userEvent.setup();
    render(<App />);
    const box = screen.getByRole("textbox", { name: /your question/i });

    await user.click(box);
    await user.paste("a".repeat(399));
    expect(screen.getByText("399 of 500 characters")).not.toHaveClass(
      "is-warn",
    );
    await user.paste("a");
    expect(screen.getByText("400 of 500 characters")).toHaveClass("is-warn");
    await user.paste("a".repeat(80));
    expect(screen.getByText("480 of 500 characters")).toHaveClass("is-alert");
    expect(screen.queryByText(/limit for one question/i)).toBeNull();
    await user.paste("a".repeat(20));
    expect(screen.getByText(/limit for one question/i)).toBeVisible();
    expect(box.value).toHaveLength(500);
  });

  test("a paste that overflows the limit shows the gentle message", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("textbox", { name: /your question/i }));
    await user.paste("b".repeat(650));
    expect(screen.getByText(/limit for one question/i)).toBeVisible();
  });
});
