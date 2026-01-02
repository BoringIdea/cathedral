import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectKnowledgeService {
  /**
   * Get comprehensive project knowledge about Cathedral
   */
  getProjectKnowledge(language: string = 'en'): string {
    const isChinese =
      language.toLowerCase().includes('zh') ||
      language.toLowerCase().includes('chinese');

    if (isChinese) {
      return `
# Cathedral 项目背景知识

## 项目概述
Cathedral 是一个开源世界的赞助平台，通过创新的代币化和市场机制彻底改变开源资助模式。平台将开源项目代币化并上链，实现开源项目与金融市场的完美结合。

## 核心机制
1. **代币化机制**：每个开源项目对应一个独立的代币池，使用 Bonding Curve 算法动态控制价格
2. **份额交易**：用户通过购买项目份额来支持开源项目，份额价格随供应量增加而上涨
3. **持续资助**：为项目提供持续的资助来源，为投资者创造潜在的盈利机会

## 手续费分发机制
- **平台运营费**：2%（支持平台日常运营和持续改进）
- **仓库所有者费**：5%（直接激励项目维护者）
- **手续费再分配**：仓库所有者可以将手续费收入分配给核心贡献者、依赖项目维护者等

## 技术特点
- **基于 Solana**：使用 Solana 区块链，Gas 费用低
- **Bonding Curve**：每个代币拥有独立的 Bonding Curve 池
- **智能合约自动化**：手续费再分配完全在智能合约中自动执行
- **权限验证**：严格的后台权限验证系统，仅允许仓库所有者发行对应代币

## 与 Pump 平台的对比优势
1. **信息可靠性**：严格验证，防止诈骗
2. **管理简化**：开发者无需复杂代币管理
3. **法律合规**：巧妙规避法律风险
4. **价值导向**：基于项目实际价值投资，而非炒作

## 生态系统价值
- 连接开源贡献者和支持者
- 建立开源项目价值评估体系
- 促进资源配置优化
- 为开源世界注入持续动力

## 投资分析要点
在分析项目时，需要重点关注：
1. **项目活跃度**：提交频率、问题解决速度、社区参与度
2. **技术质量**：代码质量、文档完整性、依赖关系
3. **社区健康度**：贡献者数量、星标增长、分叉数量
4. **市场潜力**：项目影响力、使用场景、未来发展前景
5. **风险因素**：项目维护状态、法律合规性、技术债务
      `.trim();
    } else {
      return `
# Cathedral Project Background Knowledge

## Project Overview
Cathedral is a sponsorship platform for the open source world that revolutionizes open source funding through innovative tokenization and market mechanisms. The platform tokenizes open source projects and puts them on-chain, achieving a perfect combination of open source projects and financial markets.

## Core Mechanisms
1. **Tokenization Mechanism**: Each open source project corresponds to an independent token pool using Bonding Curve algorithm to dynamically control prices
2. **Share Trading**: Users support open source projects by purchasing project shares, with share prices increasing as supply increases
3. **Continuous Funding**: Provides continuous funding sources for projects while creating potential profit opportunities for investors

## Fee Distribution Mechanism
- **Platform Operation Fee**: 2% (supports daily operations and continuous improvements)
- **Repository Owner Fee**: 5% (directly incentivizes project maintainers)
- **Fee Redistribution**: Repository owners can distribute fee income to core contributors, dependent project maintainers, etc.

## Technical Features
- **Solana-based**: Uses Solana blockchain with low gas fees
- **Bonding Curve**: Each token has an independent Bonding Curve pool
- **Smart Contract Automation**: Fee redistribution is fully automated in smart contracts
- **Permission Verification**: Strict backend permission verification system, only repository owners can issue corresponding tokens

## Advantages over Pump Platform
1. **Information Reliability**: Strict verification prevents fraud
2. **Simplified Management**: Developers don't need complex token management
3. **Legal Compliance**: Cleverly avoids legal risks
4. **Value-oriented**: Investment based on actual project value rather than speculation

## Ecosystem Value
- Connects open source contributors and supporters
- Establishes value assessment system for open source projects
- Promotes resource allocation optimization
- Injects continuous momentum into the open source world

## Investment Analysis Points
When analyzing projects, focus on:
1. **Project Activity**: Commit frequency, issue resolution speed, community participation
2. **Technical Quality**: Code quality, documentation completeness, dependency relationships
3. **Community Health**: Contributor count, star growth, fork count
4. **Market Potential**: Project influence, use cases, future development prospects
5. **Risk Factors**: Project maintenance status, legal compliance, technical debt
      `.trim();
    }
  }

  /**
   * Get specific analysis guidelines for different types of projects
   */
  getAnalysisGuidelines(language: string = 'en'): string {
    const isChinese =
      language.toLowerCase().includes('zh') ||
      language.toLowerCase().includes('chinese');

    if (isChinese) {
      return `
## 项目分析指导原则

### 高价值项目特征
1. **活跃开发**：定期提交、快速响应问题、持续更新
2. **社区活跃**：大量贡献者、活跃讨论、良好文档
3. **技术先进**：使用现代技术栈、代码质量高、架构清晰
4. **实用性强**：解决实际问题、广泛使用、有明确价值主张
5. **可持续发展**：有明确的路线图、长期维护计划、商业化潜力

### 风险项目特征
1. **低活跃度**：长期无更新、问题堆积、维护者不活跃
2. **技术债务**：代码质量差、依赖过时、架构混乱
3. **社区冷清**：贡献者少、讨论不活跃、文档缺失
4. **法律风险**：可能涉及版权问题、合规性存疑
5. **市场饱和**：竞争激烈、差异化不足、替代品多

### 投资建议框架
- **高风险高回报**：新兴技术、实验性项目、早期阶段
- **中等风险稳定回报**：成熟技术、稳定社区、持续发展
- **低风险保守投资**：知名项目、大公司支持、长期维护
      `.trim();
    } else {
      return `
## Project Analysis Guidelines

### High-Value Project Characteristics
1. **Active Development**: Regular commits, quick issue responses, continuous updates
2. **Vibrant Community**: Many contributors, active discussions, good documentation
3. **Advanced Technology**: Modern tech stack, high code quality, clear architecture
4. **Practical Value**: Solves real problems, widely used, clear value proposition
5. **Sustainable Development**: Clear roadmap, long-term maintenance plans, commercialization potential

### Risky Project Characteristics
1. **Low Activity**: Long periods without updates, accumulated issues, inactive maintainers
2. **Technical Debt**: Poor code quality, outdated dependencies, messy architecture
3. **Quiet Community**: Few contributors, inactive discussions, missing documentation
4. **Legal Risks**: Potential copyright issues, compliance concerns
5. **Market Saturation**: Intense competition, lack of differentiation, many alternatives

### Investment Recommendation Framework
- **High Risk High Reward**: Emerging technologies, experimental projects, early stage
- **Medium Risk Stable Returns**: Mature technologies, stable community, continuous development
- **Low Risk Conservative Investment**: Well-known projects, corporate backing, long-term maintenance
      `.trim();
    }
  }
}
