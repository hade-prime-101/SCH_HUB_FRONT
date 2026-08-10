import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("renders the updated sign-in copy and form labels", () => {
    const html = renderToStaticMarkup(
      <LoginForm onSubmit={async () => undefined} />,
    );

    expect(html).toContain("Sign in");
    expect(html).toContain("Continue to your account");
    expect(html).toContain("Email address");
    expect(html).toContain("Sign In");
  });
});
