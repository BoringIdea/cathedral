import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import {
  LoginDto,
  BindWalletDto,
  HoldTokenDto,
  AuthResponseDto,
  UserInfoDto,
} from '../dto/auth.dto';
import { ApiResponseDto } from '../dto/api-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'GitHub OAuth login',
    description:
      'Authenticate user with GitHub OAuth code and return JWT token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: ApiResponseDto<AuthResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OAuth code',
  })
  async handleGithubAuth(@Body() loginDto: LoginDto): Promise<any> {
    try {
      const { code } = loginDto;
      return this.authService.getGithubToken(code);
    } catch (error) {
      console.error('Auth controller error:', error);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user info',
    description: 'Get authenticated user information',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    type: ApiResponseDto<UserInfoDto>,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserInfo(@Request() req): Promise<any> {
    return this.authService.getUser(req.user.user_name);
  }

  @Post('tokens/hold')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Hold token',
    description: 'Hold a specific token (placeholder endpoint)',
  })
  @ApiBody({ type: HoldTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token hold request processed',
    type: ApiResponseDto<{ success: boolean; message: string }>,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async holdToken(
    @Body() holdTokenDto: HoldTokenDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Request() req,
  ): Promise<{ success: boolean; message: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tokenId } = holdTokenDto;

    return { success: true, message: 'Token hold request received' };
  }

  @Post('wallet/bind')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bind wallet to user account',
    description:
      'Bind a Solana wallet address to the authenticated user account',
  })
  @ApiBody({ type: BindWalletDto })
  @ApiResponse({
    status: 200,
    description: 'Wallet bound successfully',
    type: ApiResponseDto<any>,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or wallet address',
  })
  async bindWallet(
    @Body() bindWalletDto: BindWalletDto,
    @Request() req,
  ): Promise<any> {
    const jwtToken = req.headers.authorization.split(' ')[1];
    return this.authService.verifyAndBindWallet(
      bindWalletDto.signature,
      bindWalletDto.message,
      bindWalletDto.walletAddress,
      jwtToken,
    );
  }

  @Get('repositories')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user repositories',
    description: 'Get repositories from GitHub for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User repositories retrieved successfully',
    type: ApiResponseDto<any[]>,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserRepositories(@Request() req): Promise<any> {
    const username = req.user.user_name;
    console.log('Getting repositories for user:', username);
    return this.authService.getRepositoriesFromCache(username);
  }
}
