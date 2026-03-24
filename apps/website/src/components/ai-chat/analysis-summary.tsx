"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";

interface AnalysisData {
  overview: string;
  techStack: string[];
  riskAssessment: string;
  recommendation: string;
  strengths: string[];
  concerns: string[];
}

interface AnalysisSummaryProps {
  analysis: AnalysisData;
  repositoryName: string;
}

export function AnalysisSummary({ analysis, repositoryName }: AnalysisSummaryProps) {
  const getRecommendationTone = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case "high":
        return {
          text: "text-[color:var(--fg-strong)]",
          icon: <CheckCircle className="h-4 w-4 text-[color:var(--fg-strong)]" />,
        };
      case "moderate":
        return {
          text: "text-[color:var(--fg-body)]",
          icon: <AlertTriangle className="h-4 w-4 text-[color:var(--fg-body)]" />,
        };
      case "low":
        return {
          text: "text-[color:var(--danger)]",
          icon: <XCircle className="h-4 w-4 text-[color:var(--danger)]" />,
        };
      default:
        return {
          text: "text-[color:var(--fg-muted)]",
          icon: <Shield className="h-4 w-4 text-[color:var(--fg-muted)]" />,
        };
    }
  };

  const recommendationTone = getRecommendationTone(analysis.recommendation);

  return (
    <div className="space-y-4">
      <Card className="border-border bg-[color:var(--bg-surface)]">
        <CardContent className="p-4">
          <h4 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-strong)]">
            <TrendingUp className="h-4 w-4" />
            {repositoryName} overview
          </h4>
          <div className="cathedral-copy whitespace-pre-wrap text-[13px] leading-6">{analysis.overview}</div>
        </CardContent>
      </Card>

      <Card className="border-border bg-[color:var(--bg-surface)]">
        <CardContent className="p-4">
          <h4 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-strong)]">
            <Star className="h-4 w-4" />
            Technology stack
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.techStack.map((tech, index) => (
              <span key={index} className="border border-border bg-[color:var(--bg-muted)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--fg-body)]">{tech}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-[color:var(--bg-surface)]">
        <CardContent className="space-y-3 p-4">
          <h4 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-strong)]">
            {recommendationTone.icon}
            Recommendation
          </h4>
          <div className="flex items-baseline gap-2">
            <span className={`cathedral-h2 text-[24px] ${recommendationTone.text}`}>{analysis.recommendation}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">risk level</span>
          </div>
          <div className="cathedral-copy whitespace-pre-wrap text-[13px] leading-6">{analysis.riskAssessment}</div>
        </CardContent>
      </Card>

      {analysis.strengths.length > 0 && (
        <Card className="border-border bg-[color:var(--bg-surface)]">
          <CardContent className="p-4">
            <h4 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-strong)]">
              <CheckCircle className="h-4 w-4" />
              Strengths
            </h4>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-[13px] text-[color:var(--fg-body)]">
                  <div className="mt-2 h-1 w-1 shrink-0 bg-[color:var(--fg-strong)]" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {analysis.concerns.length > 0 && (
        <Card className="border-border bg-[color:var(--bg-surface)]">
          <CardContent className="p-4">
            <h4 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-strong)]">
              <AlertTriangle className="h-4 w-4" />
              Concerns
            </h4>
            <ul className="space-y-2">
              {analysis.concerns.map((concern, index) => (
                <li key={index} className="flex items-start gap-2 text-[13px] text-[color:var(--fg-body)]">
                  <div className="mt-2 h-1 w-1 shrink-0 bg-[color:var(--fg-muted)]" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
