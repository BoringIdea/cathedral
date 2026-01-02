import { ApiProperty } from '@nestjs/swagger';

export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationInfo;
}

export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Response data',
  })
  data: T;

  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Pagination information',
    required: false,
  })
  pagination?: PaginationInfo;
}

export class PaginationInfoDto {
  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 15,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Whether there are more pages',
    example: true,
  })
  hasMore: boolean;

  @ApiProperty({
    description: 'Total number of pages',
    example: 7,
  })
  totalPages: number;
}
