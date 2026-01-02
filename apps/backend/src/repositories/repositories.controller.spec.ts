import { Test, TestingModule } from '@nestjs/testing';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { JwtService } from '@nestjs/jwt';

describe('RepositoriesController', () => {
  let controller: RepositoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepositoriesController],
      providers: [
        {
          provide: RepositoriesService,
          useValue: {
            getRepositoryById: jest.fn(),
            getTotalRepositories: jest.fn(),
            getRecommendRepository: jest.fn(),
            getUserHoldingRepositories: jest.fn(),
            getPoolByRepositoryId: jest.fn(),
            getUserDeployedRepositories: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RepositoriesController>(RepositoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
