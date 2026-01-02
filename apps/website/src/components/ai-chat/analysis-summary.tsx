"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Star
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
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'high':
        return 'text-emerald-400';
      case 'moderate':
        return 'text-yellow-400';
      case 'low':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'high':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'moderate':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'low':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview */}
      <Card className="bg-[#1A1A1A] border border-gray-800/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Project Overview
          </h4>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {analysis.overview}
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="bg-[#1A1A1A] border border-gray-800/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-400" />
            Technology Stack
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.techStack.map((tech, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30"
              >
                {tech}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className="bg-[#1A1A1A] border border-gray-800/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            {getRecommendationIcon(analysis.recommendation)}
            Investment Recommendation
          </h4>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${getRecommendationColor(analysis.recommendation)}`}>
              {analysis.recommendation}
            </span>
            <span className="text-sm text-gray-400">
              Risk Level
            </span>
          </div>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {analysis.riskAssessment}
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <Card className="bg-[#1A1A1A] border border-gray-800/50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Key Strengths
            </h4>
            <ul className="space-y-1">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-emerald-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Concerns */}
      {analysis.concerns.length > 0 && (
        <Card className="bg-[#1A1A1A] border border-gray-800/50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Potential Concerns
            </h4>
            <ul className="space-y-1">
              {analysis.concerns.map((concern, index) => (
                <li key={index} className="text-sm text-yellow-300 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                  {concern}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
