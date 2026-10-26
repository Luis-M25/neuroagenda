import { IsString } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password-strength.validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
