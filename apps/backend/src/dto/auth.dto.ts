import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'GitHub OAuth code',
    example: 'abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class BindWalletDto {
  @ApiProperty({
    description: 'Wallet signature',
    example: 'signature_string_here',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'Message that was signed',
    example: 'Please sign this message to bind your wallet',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Wallet address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

export class HoldTokenDto {
  @ApiProperty({
    description: 'Token ID to hold',
    example: 'token123',
  })
  @IsString()
  @IsNotEmpty()
  tokenId: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Authentication success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'JWT token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  jwt_token: string;

  @ApiProperty({
    description: 'GitHub username',
    example: 'johndoe',
  })
  user_name: string;
}

export class UserInfoDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'GitHub login',
    example: 'johndoe',
  })
  githubLogin: string;

  @ApiProperty({
    description: 'GitHub ID',
    example: 12345678,
  })
  githubId: number | string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://avatars.githubusercontent.com/u/12345678?v=4',
    required: false,
  })
  avatarUrl?: string;

  @ApiProperty({
    description: 'Bound wallet address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    required: false,
  })
  wallet?: string;

  @ApiProperty({
    description: 'JWT token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  jwtToken?: string;

  @ApiProperty({
    description: 'GitHub repositories count',
    example: 25,
    required: false,
  })
  githubRepositoriesCount?: number;

  @ApiProperty({
    description: 'GitHub stars',
    example: 150,
    required: false,
  })
  githubStars?: number;

  @ApiProperty({
    description: 'GitHub followers',
    example: 50,
    required: false,
  })
  githubFollowers?: number;

  @ApiProperty({
    description: 'GitHub name',
    example: 'John Doe',
    required: false,
  })
  githubName?: string;

  @ApiProperty({
    description: 'GitHub access token',
    example: 'gho_token123',
    required: false,
  })
  githubAccessToken?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  createdAt?: string;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  updatedAt?: string;
}
