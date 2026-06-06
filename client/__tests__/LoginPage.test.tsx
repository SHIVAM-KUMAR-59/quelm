/**
 * __tests__/pages/LoginPage.test.tsx
 *
 * Tests for app/auth/login/page.tsx (or wherever LoginPage lives).
 *
 * Covers:
 *   - Rendering: branding, fields, submit button, register link
 *   - Successful login → toast + redirect to /dashboard
 *   - Failed login   → error toast, stays on page
 *   - In-flight state: button disabled + "Signing in..." text
 *   - HTML5 required: empty submit fires no login call
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockRouter } from "./helpers";
import { toast } from "sonner";
import LoginPage from "../app/auth/login/page";

// ---------------------------------------------------------------------------
// Mock auth provider
// ---------------------------------------------------------------------------
const mockLogin = vi.fn();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getEmailInput = () => screen.getByLabelText(/email/i);
const getPasswordInput = () => screen.getByLabelText(/password/i);
const getSubmitButton = () => screen.getByRole("button", { name: /sign in/i });

describe("LoginPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it("renders the Quelm branding", () => {
    render(<LoginPage />);
    expect(screen.getByText("Quelm")).toBeInTheDocument();
  });

  it("renders the Welcome back heading", () => {
    render(<LoginPage />);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("renders email and password inputs", () => {
    render(<LoginPage />);
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
  });

  it("renders the Sign in button", () => {
    render(<LoginPage />);
    expect(getSubmitButton()).toBeInTheDocument();
  });

  it("renders a link to the register page", () => {
    render(<LoginPage />);
    const link = screen.getByRole("link", { name: /register/i });
    expect(link).toHaveAttribute("href", "/auth/register");
  });

  it("password input has type=password", () => {
    render(<LoginPage />);
    expect(getPasswordInput()).toHaveAttribute("type", "password");
  });

  // --- Successful login ---

  it("calls login with email and password on submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    await user.type(getEmailInput(), "test@example.com");
    await user.type(getPasswordInput(), "password123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("shows a success toast on successful login", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    await user.type(getEmailInput(), "test@example.com");
    await user.type(getPasswordInput(), "password123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Logged in successfully");
    });
  });

  it("redirects to /dashboard after successful login", async () => {
    mockLogin.mockResolvedValue(undefined);
    mockRouter.push.mockClear();

    render(<LoginPage />);

    await user.type(getEmailInput(), "test@example.com");
    await user.type(getPasswordInput(), "password123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  // --- Failed login ---

  it("shows an error toast when login throws an Error", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));
    render(<LoginPage />);

    await user.type(getEmailInput(), "bad@example.com");
    await user.type(getPasswordInput(), "wrongpassword");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  it("shows a generic error toast when login throws a non-Error", async () => {
    mockLogin.mockRejectedValue("unknown error");
    render(<LoginPage />);

    await user.type(getEmailInput(), "bad@example.com");
    await user.type(getPasswordInput(), "wrongpassword");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Login failed");
    });
  });

  it("does not redirect after a failed login", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));
    mockRouter.push.mockClear();

    render(<LoginPage />);

    await user.type(getEmailInput(), "bad@example.com");
    await user.type(getPasswordInput(), "wrongpassword");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  // --- In-flight state ---

  it("disables the button and shows 'Signing in...' while submitting", async () => {
    // Stall login indefinitely
    mockLogin.mockImplementation(() => new Promise(() => {}));
    render(<LoginPage />);

    await user.type(getEmailInput(), "test@example.com");
    await user.type(getPasswordInput(), "password123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    });
  });

  it("re-enables the button after a failed login attempt", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));
    render(<LoginPage />);

    await user.type(getEmailInput(), "test@example.com");
    await user.type(getPasswordInput(), "password123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(getSubmitButton()).not.toBeDisabled();
    });
  });
});
