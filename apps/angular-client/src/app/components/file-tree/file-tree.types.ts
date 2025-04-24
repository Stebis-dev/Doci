import { ProjectFile } from '@doci/shared';
import { MethodDetail } from '@doci/shared';

export type NodeType = 'file' | 'directory' | 'class' | 'enum' | 'interface' | 'method';

export interface TreeNode {
    name: string;
    path: string;
    type: NodeType;
    children?: TreeNode[];
    isExpanded?: boolean;
    file?: ProjectFile;
    methodDetail?: MethodDetail;
    classType?: 'class' | 'enum' | 'interface';
}

export interface FileTreeSelection {
    file: ProjectFile;
    selectedType: 'file' | 'class' | 'enum' | 'method';
    className?: string;
    enumName?: string;
    methodName?: string;
} 