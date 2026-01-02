import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({
    description: 'User message content',
    example: 'What is the main technology stack of this project?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Repository ID',
    example: 1,
  })
  @IsNumber()
  repositoryId: number;

  @ApiProperty({
    description: 'Chat session ID for conversation continuity',
    example: 'chat-session-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'AI response message',
    example: 'This project uses React, TypeScript, and Next.js...',
  })
  message: string;

  @ApiProperty({
    description: 'Chat session ID',
    example: 'chat-session-123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Analysis confidence score (0-1)',
    example: 0.85,
  })
  confidence: number;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;
}

export class RepositoryAnalysisDto {
  @ApiProperty({
    description: 'Repository ID',
    example: 1,
  })
  repositoryId: number;

  @ApiProperty({
    description: 'Project overview summary',
    example: 'A modern web application built with React and TypeScript...',
  })
  overview: string;

  @ApiProperty({
    description: 'Technology stack analysis',
    example: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
  })
  techStack: string[];

  @ApiProperty({
    description: 'Key metrics and statistics',
    example: {
      stars: 1500,
      forks: 300,
      contributors: 25,
      lastCommit: '2024-01-01T00:00:00.000Z',
    },
  })
  metrics: Record<string, any>;

  @ApiProperty({
    description: 'Investment risk assessment',
    example: 'Medium risk - Active development, good community support',
  })
  riskAssessment: string;

  @ApiProperty({
    description: 'Investment recommendation level',
    example: 'Moderate',
    enum: ['Low', 'Moderate', 'High'],
  })
  recommendation: string;

  @ApiProperty({
    description: 'Key strengths',
    example: ['Active development', 'Good documentation', 'Strong community'],
  })
  strengths: string[];

  @ApiProperty({
    description: 'Potential concerns',
    example: ['New project', 'Limited contributors', 'Uncertain roadmap'],
  })
  concerns: string[];
}
