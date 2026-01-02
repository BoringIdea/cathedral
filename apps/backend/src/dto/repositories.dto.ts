import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';

export enum SortField {
  CREATED_AT = 'createdAt',
  MARKET_CAP = 'market_cap',
  STARS = 'stars',
  FORKS = 'forks',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetRepositoriesQueryDto {
  @ApiProperty({
    description: 'Field to sort by',
    enum: SortField,
    required: false,
    default: SortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortField)
  sort?: SortField = SortField.CREATED_AT;

  @ApiProperty({
    description: 'Sort order',
    enum: SortOrder,
    required: false,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @ApiProperty({
    description: 'Page number',
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    required: false,
    default: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 15;

  @ApiProperty({
    description: 'Time filter (timestamp)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  time?: number;

  @ApiProperty({
    description: 'Minimum stars',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStars?: number;

  @ApiProperty({
    description: 'Maximum stars',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStars?: number;

  @ApiProperty({
    description: 'Minimum forks',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minForks?: number;

  @ApiProperty({
    description: 'Maximum forks',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxForks?: number;

  @ApiProperty({
    description: 'Minimum market cap (in lamports)',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minMarketCap?: number;

  @ApiProperty({
    description: 'Maximum market cap (in lamports)',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxMarketCap?: number;

  @ApiProperty({
    description: 'Minimum total volume (in lamports)',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minVolume?: number;

  @ApiProperty({
    description: 'Maximum total volume (in lamports)',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxVolume?: number;
}

export class SearchRepositoriesQueryDto {
  @ApiProperty({
    description: 'Search term',
    example: 'react',
  })
  @IsString()
  @IsNotEmpty()
  term: string;
}

export class RepositoryDto {
  @ApiProperty({
    description: 'Repository ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Repository name',
    example: 'awesome-project',
  })
  name: string;

  @ApiProperty({
    description: 'Repository owner',
    example: 'johndoe',
  })
  owner: string;

  @ApiProperty({
    description: 'Repository avatar URL',
    example: 'https://example.com/avatar.png',
  })
  ownerAvatarUrl: string;

  @ApiProperty({
    description: 'Repository owner followers',
    example: 100,
  })
  ownerFollowers: number;

  @ApiProperty({
    description: 'Repository description',
    example: 'An awesome project for developers',
  })
  description: string;

  @ApiProperty({
    description: 'Number of stars',
    example: 1500,
  })
  stars: number | string;

  @ApiProperty({
    description: 'Number of forks',
    example: 300,
  })
  forks: number | string;

  @ApiProperty({
    description: 'Number of contributors',
    example: 10,
  })
  contributors: number | string;

  @ApiProperty({
    description: 'Forks URL',
    example: 'https://github.com/johndoe/awesome-project/forks',
  })
  forksUrl: string;

  @ApiProperty({
    description: 'Is fork',
    example: true,
  })
  isFork: boolean;

  @ApiProperty({
    description: 'Repository image URL',
    example: 'https://example.com/image.png',
    required: false,
  })
  imgUrl?: string;

  @ApiProperty({
    description: 'Repository link',
    example: 'https://github.com/johndoe/awesome-project',
    required: false,
  })
  link?: string;

  @ApiProperty({
    description: 'Pool address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    required: false,
  })
  pool?: string;

  @ApiProperty({
    description: 'Token supply',
    example: 1000000,
    required: false,
  })
  supply?: number;

  @ApiProperty({
    description: 'Total volume',
    example: 50000,
    required: false,
  })
  totalVolume?: number;

  @ApiProperty({
    description: 'Market cap',
    example: 100000,
    required: false,
  })
  marketCap?: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  createdAt?: string;

  @ApiProperty({
    description: 'Token mint address',
    example: 'TokenMintAddress123',
    required: false,
  })
  tokenMint?: string;

  @ApiProperty({
    description: 'Is deployed',
    example: true,
    required: false,
  })
  isDeployed?: boolean;

  @ApiProperty({
    description: 'Is deleted',
    example: false,
    required: false,
  })
  isDeleted?: boolean;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  updatedAt?: string;
}

export class PoolInfoDto {
  @ApiProperty({
    description: 'Pool address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  })
  pool: string;

  @ApiProperty({
    description: 'Token mint address',
    example: 'TokenMintAddress123',
  })
  tokenMint: string;

  @ApiProperty({
    description: 'Current price',
    example: 0.5,
    required: false,
  })
  price?: number;

  @ApiProperty({
    description: 'Total supply',
    example: 1000000,
    required: false,
  })
  supply?: number;

  @ApiProperty({
    description: 'Reserve SOL',
    example: 1000,
    required: false,
  })
  reserveSol?: number;

  @ApiProperty({
    description: 'Reserve token',
    example: 2000000,
    required: false,
  })
  reserveToken?: number;

  @ApiProperty({
    description: 'Creator address',
    example: 'CreatorAddress123',
    required: false,
  })
  creator?: string;

  @ApiProperty({
    description: 'Pool token account',
    example: 'PoolTokenAccount123',
    required: false,
  })
  poolTokenAccount?: string;

  @ApiProperty({
    description: 'Pool SOL vault',
    example: 'PoolSolVault123',
    required: false,
  })
  poolSolVault?: string;

  @ApiProperty({
    description: 'Pool SOL fee vault',
    example: 'PoolSolFeeVault123',
    required: false,
  })
  poolSolFeeVault?: string;

  @ApiProperty({
    description: 'Description',
    example: 'Pool description',
    required: false,
  })
  description?: string;
}

export class OrderDto {
  @ApiProperty({
    description: 'Order ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Order type',
    example: 'buy',
    required: false,
  })
  type?: string;

  @ApiProperty({
    description: 'Amount',
    example: 100,
  })
  amount: number;

  @ApiProperty({
    description: 'Price',
    example: 0.5,
  })
  price: number;

  @ApiProperty({
    description: 'User address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  })
  user: string;

  @ApiProperty({
    description: 'Transaction signature',
    example: 'signature123',
    required: false,
  })
  signature?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Pool address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    required: false,
  })
  pool?: string;

  @ApiProperty({
    description: 'Side (buy/sell)',
    example: 'buy',
    required: false,
  })
  side?: string;

  @ApiProperty({
    description: 'Unique ID',
    example: 'unique123',
    required: false,
  })
  uniqueId?: string;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  updatedAt?: string;
}

export class PoolOverviewDto {
  @ApiProperty({
    description: 'Pool address',
    example: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    required: false,
  })
  pool?: string;

  @ApiProperty({
    description: 'Total volume',
    example: 50000,
  })
  totalVolume: number;

  @ApiProperty({
    description: '24h volume',
    example: 5000,
    required: false,
  })
  volume24h?: number;

  @ApiProperty({
    description: 'Current price',
    example: 0.5,
    required: false,
  })
  currentPrice?: number;

  @ApiProperty({
    description: 'Price change 24h',
    example: 0.05,
    required: false,
  })
  priceChange24h?: number;

  @ApiProperty({
    description: 'Market cap',
    example: 100000,
    required: false,
  })
  marketCap?: number;

  @ApiProperty({
    description: 'Total supply',
    example: 1000000,
    required: false,
  })
  totalSupply?: number;

  @ApiProperty({
    description: 'SOL reserve',
    example: 1000,
    required: false,
  })
  solReserve?: number;
}

export class UploadImageResponseDto {
  @ApiProperty({
    description: 'Upload success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Uploaded image URL',
    example: 'https://cloudinary.com/image.png',
    required: false,
  })
  data?: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Upload failed',
    required: false,
  })
  error?: string;
}

export class UserHoldingDto {
  @ApiProperty({
    description: 'Repository ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Repository name',
    example: 'awesome-project',
  })
  name: string;

  @ApiProperty({
    description: 'User balance',
    example: 1000,
  })
  balance: number;
}
