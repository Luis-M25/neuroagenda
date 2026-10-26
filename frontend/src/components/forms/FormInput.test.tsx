import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormInput } from '@/components/forms/FormInput';

describe('FormInput Component', () => {
  it('debe renderizar correctamente', () => {
    render(
      <FormInput
        label="Email"
        type="email"
        placeholder="usuario@ejemplo.com"
      />,
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('usuario@ejemplo.com');
    expect(input).toBeInTheDocument();
  });

  it('debe mostrar asterisco para campos requeridos', () => {
    render(<FormInput label="Nombre" required />);

    const label = screen.getByText((content: string, element: Element | null) => {
      return element?.tagName.toLowerCase() === 'label' && content.includes('Nombre');
    });

    expect(label).toBeInTheDocument();
    expect(label.querySelector('span')?.textContent).toBe('*');
  });

  it('debe mostrar mensaje de error', () => {
    render(
      <FormInput
        label="Email"
        error="Email inválido"
        touched={true}
      />,
    );

    expect(screen.getByText('Email inválido')).toBeInTheDocument();
  });

  it('debe mostrar help text', () => {
    render(
      <FormInput
        label="Contraseña"
        helpText="Mínimo 8 caracteres"
      />,
    );

    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
  });

  it('debe ser deshabilitado cuando disabled=true', () => {
    const { container } = render(
      <FormInput label="Campo deshabilitado" disabled />,
    );

    const input = container.querySelector('input');
    expect(input).toBeDisabled();
  });

  it('debe actualizar el valor cuando se tipea', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FormInput label="Test" defaultValue="" />,
    );

    const input = container.querySelector('input') as HTMLInputElement;
    await user.type(input, 'nuevo valor');

    expect(input.value).toBe('nuevo valor');
  });

  it('debe soportar diferentes tipos de input', () => {
    const { container: containerEmail } = render(
      <FormInput label="Email" type="email" />,
    );
    const { container: containerPassword } = render(
      <FormInput label="Password" type="password" />,
    );

    const emailInput = containerEmail.querySelector('input[type="email"]');
    const passwordInput = containerPassword.querySelector('input[type="password"]');

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('no debe mostrar error sin touched', () => {
    render(
      <FormInput
        label="Email"
        error="Error message"
        touched={false}
      />,
    );

    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
  });
});
