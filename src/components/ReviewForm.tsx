import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Star,
  MessageSquare,
  Save,
  Send,
  Clock
} from "lucide-react";

interface ReviewFormProps {
  submissionId: string;
  maxScore: number;
  onSubmit?: (reviewData: {
    correct: boolean;
    scoreAwarded: number;
    remarks: string;
    categories: {
      correctness: number;
      efficiency: number;
      codeQuality: number;
      approach: number;
    };
  }) => void;
  onSaveDraft?: (draftData: any) => void;
  initialData?: {
    correct?: boolean;
    scoreAwarded?: number;
    remarks?: string;
    categories?: {
      correctness: number;
      efficiency: number;
      codeQuality: number;
      approach: number;
    };
  };
}

export function ReviewForm({ 
  submissionId, 
  maxScore, 
  onSubmit, 
  onSaveDraft, 
  initialData 
}: ReviewFormProps) {
  const [verdict, setVerdict] = useState<'ACCEPT' | 'REJECT' | 'PARTIAL' | null>(
    initialData?.correct === true ? 'ACCEPT' : 
    initialData?.correct === false ? 'REJECT' : null
  );
  const [scoreAwarded, setScoreAwarded] = useState(initialData?.scoreAwarded || 0);
  const [remarks, setRemarks] = useState(initialData?.remarks || "");
  
  // Detailed scoring categories
  const [categories, setCategories] = useState({
    correctness: initialData?.categories?.correctness || 5,
    efficiency: initialData?.categories?.efficiency || 5,
    codeQuality: initialData?.categories?.codeQuality || 5,
    approach: initialData?.categories?.approach || 5,
  });

  const [commonFeedback, setCommonFeedback] = useState("");

  // Common feedback templates
  const feedbackTemplates = [
    {
      category: "Correct Solutions",
      templates: [
        "Excellent solution! Clean implementation with optimal time complexity.",
        "Good approach with correct logic. Well-structured code.",
        "Correct solution with good variable naming and comments.",
      ]
    },
    {
      category: "Partial Solutions", 
      templates: [
        "Good approach but contains minor logical errors in edge cases.",
        "Correct algorithm but inefficient implementation. Consider optimizing.",
        "Solution works for basic cases but fails on larger inputs.",
      ]
    },
    {
      category: "Incorrect Solutions",
      templates: [
        "Incorrect approach. Please review the problem requirements.",
        "Logic error in the main algorithm. Consider a different strategy.",
        "Implementation has several bugs. Debug step by step.",
      ]
    }
  ];

  const handleVerdictChange = (newVerdict: 'ACCEPT' | 'REJECT' | 'PARTIAL') => {
    setVerdict(newVerdict);
    
    // Auto-adjust score based on verdict
    if (newVerdict === 'ACCEPT') {
      setScoreAwarded(maxScore);
    } else if (newVerdict === 'REJECT') {
      setScoreAwarded(0);
    } else if (newVerdict === 'PARTIAL') {
      setScoreAwarded(Math.floor(maxScore * 0.5)); // 50% for partial
    }
  };

  const handleCategoryChange = (category: keyof typeof categories, value: number[]) => {
    setCategories(prev => ({
      ...prev,
      [category]: value[0]
    }));
  };

  const calculateSuggestedScore = () => {
    const avgCategory = (categories.correctness + categories.efficiency + categories.codeQuality + categories.approach) / 4;
    return Math.round((avgCategory / 10) * maxScore);
  };

  const handleSubmitReview = () => {
    if (!verdict) return;
    
    onSubmit?.({
      correct: verdict === 'ACCEPT',
      scoreAwarded,
      remarks,
      categories
    });
  };

  const handleSaveDraft = () => {
    onSaveDraft?.({
      verdict,
      scoreAwarded,
      remarks,
      categories
    });
  };

  const addTemplate = (template: string) => {
    setRemarks(prev => prev ? `${prev}\n\n${template}` : template);
  };

  return (
    <div className="space-y-6">
      {/* Quick Verdict */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Review Verdict
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={verdict === 'ACCEPT' ? "default" : "outline"}
              onClick={() => handleVerdictChange('ACCEPT')}
              className="flex items-center gap-2 flex-1"
            >
              <CheckCircle className="h-4 w-4" />
              Accept
            </Button>
            <Button
              variant={verdict === 'PARTIAL' ? "secondary" : "outline"}
              onClick={() => handleVerdictChange('PARTIAL')}
              className="flex items-center gap-2 flex-1"
            >
              <AlertCircle className="h-4 w-4" />
              Partial
            </Button>
            <Button
              variant={verdict === 'REJECT' ? "destructive" : "outline"}
              onClick={() => handleVerdictChange('REJECT')}
              className="flex items-center gap-2 flex-1"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Detailed Scoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(categories).map(([category, value]) => (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="capitalize">{category}</Label>
                <span className="text-sm text-muted-foreground">{value}/10</span>
              </div>
              <Slider
                value={[value]}
                onValueChange={(newValue) => handleCategoryChange(category as keyof typeof categories, newValue)}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Suggested Score:</span>
              <Badge variant="outline">
                {calculateSuggestedScore()} / {maxScore} points
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Score Override */}
      <Card>
        <CardHeader>
          <CardTitle>Final Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="final-score">Score Awarded:</Label>
              <Input
                id="final-score"
                type="number"
                min="0"
                max={maxScore}
                value={scoreAwarded}
                onChange={(e) => setScoreAwarded(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                / {maxScore} points
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setScoreAwarded(calculateSuggestedScore())}
              >
                Use Suggested
              </Button>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(scoreAwarded / maxScore) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Feedback Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedbackTemplates.map((section) => (
              <div key={section.category}>
                <h4 className="font-medium text-sm mb-2">{section.category}</h4>
                <div className="grid gap-2">
                  {section.templates.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => addTemplate(template)}
                      className="text-left justify-start h-auto p-2 text-xs"
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Remarks */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Provide detailed feedback about the solution, approach, code quality, and suggestions for improvement..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {remarks.length} characters • Be specific and constructive in your feedback
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Auto-saved 2 minutes ago</span>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={handleSubmitReview}
            disabled={!verdict || !remarks.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Review
          </Button>
        </div>
      </div>
    </div>
  );
}