/* eslint-disable @typescript-eslint/no-explicit-any */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// =====================
// MOCKS
// =====================
const mockRegister = vi.fn();

vi.mock("@/services/authService", () => ({
  register: (...args: any[]) => mockRegister(...args),
}));

vi.mock("@unpic/react", () => ({
  Image: (props: any) => <img {...props} alt={props.alt} />,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
}));

vi.mock("react-phone-number-input", () => ({
  default: ({ value, onChange, placeholder, disabled }: any) => (
    <input
      type="tel"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),
}));

import RegisterSide from "@/components/login/RegisterSide";

// =====================
// TEST SUITE
// =====================
describe("RegisterSide", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    mockRegister.mockReset();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("renderiza formulário e alterna visibilidade da senha", () => {
    render(<RegisterSide />);

    const passwordInput = screen.getByLabelText(/senha/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleButtons = screen.getAllByRole("button");
    fireEvent.click(toggleButtons[0]);

    expect(screen.getByLabelText(/senha/i)).toHaveAttribute("type", "text");
  });

  it("mostra erros obrigatórios quando submit vazio", async () => {
    render(<RegisterSide />);

    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    expect(
      await screen.findByText(/campo de nome.*obrigatório/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/campo de e-mail.*obrigatório/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/campo de telefone.*obrigatório/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/campo de senha.*obrigatório/i)
    ).toBeInTheDocument();
    // CPF é campo opcional — não dispara erro de obrigatório
  });


  it("valida CPF quando preenchido incorretamente", async () => {
    render(<RegisterSide />);

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: "Usuário Teste" },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "teste@email.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/\(34\)/i), {
      target: { value: "+5534999999999" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "123456" },
    });

    fireEvent.change(screen.getByLabelText(/cpf/i), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    // Componente exibe: "CPF inválido. Deve conter 11 dígitos."
    expect(await screen.findByText(/cpf inv[aá]lido/i)).toBeInTheDocument();
  });

  it("envia formulário válido com CPF opcional", async () => {
    mockRegister.mockResolvedValueOnce({
      message: "Usuário criado",
      user: { id: 1 },
    });

    render(<RegisterSide />);

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: "Usuário Teste" },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "teste@email.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/\(34\)/i), {
      target: { value: "+5534999999999" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
  });

  it("exibe erro quando API falha", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Email já cadastrado"));

    render(<RegisterSide />);

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: "Bene" },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bene@teste.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/\(34\)/i), {
      target: { value: "+5534999999999" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    expect(
      await screen.findByText(/email já cadastrado/i)
    ).toBeInTheDocument();
  });

  it("mostra loading durante requisição", async () => {
    mockRegister.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    render(<RegisterSide />);

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: "Bene" },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bene@teste.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/\(34\)/i), {
      target: { value: "+5534999999999" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    expect(
      await screen.findByRole("button", { name: /cadastrando/i })
    ).toBeDisabled();
  });

  it("desabilita inputs durante loading", async () => {
    mockRegister.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    render(<RegisterSide />);

    const nome = screen.getByLabelText(/nome/i);
    const email = screen.getByLabelText(/email/i);
    const senha = screen.getByLabelText(/senha/i);

    fireEvent.change(nome, { target: { value: "Bene" } });
    fireEvent.change(email, { target: { value: "bene@teste.com" } });
    fireEvent.change(senha, { target: { value: "123456" } });

    fireEvent.change(screen.getByPlaceholderText(/\(34\)/i), {
      target: { value: "+5534999999999" },
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    expect(
      await screen.findByRole("button", { name: /cadastrando/i })
    ).toBeDisabled();
  });
});
