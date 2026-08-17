import { IsString } from 'class-validator';

export class WipeDataDto {
  @IsString()
  password: string;
}
