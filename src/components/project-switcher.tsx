
"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import type { Project } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSelectedProject } from "@/hooks/use-selected-project";

type ProjectSwitcherProps = {
  orgName: string;
  projects: Project[];
  selectedProject: Project | null;
};

export function ProjectSwitcher({ orgName, projects, selectedProject }: ProjectSwitcherProps) {
  const { setSelectedProject } = useSelectedProject();

  const handleSelect = (project: Project | null) => {
    setSelectedProject(project);
  };
  
  const currentProject = selectedProject;
  const headerTitle = currentProject ? `${orgName} / ${currentProject.display_name}` : orgName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-lg font-semibold px-2"
        >
          {headerTitle}
          <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{orgName}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => handleSelect(null)}>
            <div className="flex items-center w-full">
              <span className="flex-1">View All Projects</span>
              {!currentProject && <Check className="ml-2 h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            <DropdownMenuLabel>Projects</DropdownMenuLabel>
            {projects.map((project) => (
                <DropdownMenuItem
                    key={project.project_id}
                    onSelect={() => handleSelect(project)}
                >
                    <div className="flex items-center w-full">
                        <span className="flex-1">{project.display_name}</span>
                        {currentProject?.project_id === project.project_id && <Check className="ml-2 h-4 w-4" />}
                    </div>
                </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/projects/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
