/**
 * Tests for app/auth/register/page.tsx
 *
 * Covers:
 *   - Rendering: branding, name/email/password fields, submit, login link
 *   - Successful registration → toast + redirect to /dashboard
 *   - Failed registration    → error toast, stays on page
 *   - In-flight state: button disabled + "Creating account..."
 *   - minLength=6 HTML5 attribute present on password field
 *   - register() called with correct args (email, password, name)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockRouter } from "./helpers";
import { toast } from "sonner";
import RegisterPage from "../app/auth/register/page";

// ---------------------------------------------------------------------------
// Mock auth provider
// ---------------------------------------------------------------------------
const mockRegister = vi.fn();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ register: mockRegister }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getNameInput = () => screen.getByLabelText(/^name$/i);
const getEmailInput = () => screen.getByLabelText(/^email$/i);
const getPasswordInput = () => screen.getByLabelText(/^password$/i);
const getSubmitButton = () => screen.getByRole("button", { name: /create account/i });

describe("RegisterPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it("renders the Quelm branding", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Quelm")).toBeInTheDocument();
  });

  it("renders the Create an account heading", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Create an account")).toBeInTheDocument();
  });

  it("renders name, email, and password inputs", () => {
    render(<RegisterPage />);
    expect(getNameInput()).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
  });

  it("renders the Create account submit button", () => {
    render(<RegisterPage />);
    expect(getSubmitButton()).toBeInTheDocument();
  });

  it("renders a Sign in link pointing to /auth/login", () => {
    render(<RegisterPage />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/auth/login");
  });

  it("password input has type=password", () => {
    render(<RegisterPage />);
    expect(getPasswordInput()).toHaveAttribute("type", "password");
  });

  it("password input has minLength=6", () => {
    render(<RegisterPage />);
    expect(getPasswordInput()).toHaveAttribute("minlength", "6");
  });

  it("name input has type=text", () => {
    render(<RegisterPage />);
    expect(getNameInput()).toHaveAttribute("type", "text");
  });

  // --- Successful registration ---

  it("calls register with email, password, and name on submit", async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    await user.type(getNameInput(), "Jane Doe");
    await user.type(getEmailInput(), "jane@example.com");
    await user.type(getPasswordInput(), "secure123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "jane@example.com",
        "secure123",
        "Jane Doe",
      );
    });
  });

  it("shows a success toast on successful registration", async () => {
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    await user.type(getNameInput(), "Jane Doe");
    await user.type(getEmailInput(), "jane@example.com");
    await user.type(getPasswordInput(), "secure123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Account created successfully");
    });
  });

  it("redirects to /dashboard after successful registration", async () => {
    mockRegister.mockResolvedValue(undefined);
    mockRouter.push.mockClear();

    render(<RegisterPage />);

    await user.type(getNameInput(), "Jane Doe");
    await user.type(getEmailInput(), "jane@example.com");
    await user.type(getPasswordInput(), "secure123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "jane@example.com",
        "secure123",
        "Jane Doe",
      );
    });

    expect(toast.success).toHaveBeenCalledWith("Account created successfully");

    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
  });

  // --- Failed registration ---

  it("shows an error toast when register throws an Error", async () => {
    mockRegister.mockRejectedValue(new Error("Email already in use"));
    render(<RegisterPage />);

    await user.type(getNameInput(), "Jane Doe");
    await user.type(getEmailInput(), "existing@example.com");
    await user.type(getPasswordInput(), "secure123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already in use");
    });
  });

  it("shows a generic error toast when register throws a non-Error", async () => {
    mockRegister.mockRejectedValue("network failure");
    render(<RegisterPage />);

    await user.type(getNameInput(), "Jane Doe");
    await user.type(getEmailInput(), "jane@example.com");
    await user.type(getPasswordInput(), "secure123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Registration failed");
    });
  });

  it("does not redirect after a failed registration", async () => {
    mockRegister.mockRejectedValue(new Error("Email already in use"));
    mockRouter.push.mockClear();

    render(<RegisterPage />);

    await user.type(getNameInput(), "Jane Doe");
    await user.type(getEmailInput(), "existing@example.com");
    await user.type(getPasswordInput(), "secure123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already in use");
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  // --- In-flight state ---

  it("disables the button and shows 'Creating account...' while submitting", async () => {
    mockRegister.mockImplementation(() => new Promise(() => {}));
    render(<RegisterPage />);

    await user.type(getNameInput(), "Jane Doe");
    await user.type(getEmailInput(), "jane@example.com");
    await user.type(getPasswordInput(), "secure123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
    });
  });

  it("re-enables the button after a failed registration", async () => {
    mockRegister.mockRejectedValue(new Error("Email already in use"));
    render(<RegisterPage />);

    await user.type(getNameInput(), "Jane Doe");
    await user.type(getEmailInput(), "existing@example.com");
    await user.type(getPasswordInput(), "secure123");
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(getSubmitButton()).not.toBeDisabled();
    });
  });
});
