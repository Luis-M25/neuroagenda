import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') return false;
          return (
            value.length >= 8 &&
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /\d/.test(value) &&
            // Incluye el set del generador del frontend (utils.ts PASSWORD_SYM): ? _ + - =
            /[!@#$%^&*(),.?":{}|<>?_=+-]/.test(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener al menos 8 caracteres, una mayuscula, una minuscula, un digito y un caracter especial`;
        },
      },
    });
  };
}
