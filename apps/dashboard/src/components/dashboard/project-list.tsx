'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDuration } from '@/lib/utils';
import { FolderGit2 } from 'lucide-react';

interface ProjectListProps {
  data: Array<{
    name: string;
    minutes: number;
    percentage: number;
  }>;
}

export function ProjectList({ data }: ProjectListProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderGit2 className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No project data yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 5).map((project) => (
            <div key={project.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {project.name}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDuration(project.minutes)}
                </span>
              </div>
              <Progress value={project.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
