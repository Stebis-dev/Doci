import { Injectable } from '@angular/core';
import { MethodDetail } from '@doci/shared';

export interface GraphData {
    nodes: Array<{
        id: string;
        label: string;
        size: number;
        color: string;
        x: number;
        y: number;
        type?: 'method' | 'class'; // Add type for icon selection
    }>;
    edges: Array<{
        id: string;
        source: string;
        target: string;
        label: string;
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class GraphService {
    constructor() {
        //
    }

    generateMethodUsageGraph(methodDetail: MethodDetail): GraphData {
        const nodes: GraphData['nodes'] = [];
        const edges: GraphData['edges'] = [];

        // Add the main method as the central node at the top
        nodes.push({
            id: methodDetail.name,
            label: methodDetail.name,
            size: 12,
            color: '#E91E63', // Primary node color
            x: 0,
            y: 0,
            type: 'method'
        });

        console.log('Method usedIn Detail:', methodDetail.usedIn);
        // Group usages by class to prevent duplication
        if (methodDetail.usedIn && methodDetail.usedIn.length > 0) {
            const classGroups = new Map<string, string[]>();

            // Group methods by their class
            methodDetail.usedIn.forEach(usage => {
                if (!usage.methodUsedIn) return;

                const classKey = usage.classUsedIn || 'Unknown Class';
                if (!classGroups.has(classKey)) {
                    classGroups.set(classKey, []);
                }
                const methodUsedIn = usage.methodUsedIn;
                if (methodUsedIn) {
                    const uniqueMethods = classGroups.get(classKey);
                    uniqueMethods?.push(methodUsedIn);
                    classGroups.set(classKey, Array.from(new Set(uniqueMethods)));
                }
            });

            console.log('Class Groups:', classGroups);

            // Calculate layout parameters
            const totalClasses = classGroups.size;
            const classSpacing = 0.4; // Horizontal spacing between classes
            const verticalSpacing = 0.3; // Vertical spacing between levels

            // Create nodes and edges for each class and its methods
            Array.from(classGroups.entries()).forEach(([className, usages], classIndex) => {
                // Position class horizontally centered and below main method
                const classX = (classIndex - (totalClasses - 1) / 2) * classSpacing;
                const classY = verticalSpacing; // Fixed vertical distance from main method

                // Create class node
                nodes.push({
                    id: className,
                    label: className,
                    size: 10,
                    color: '#2196F3', // Class node color
                    x: classX,
                    y: classY,
                    type: 'class'
                });

                // Connect main method to class
                edges.push({
                    id: `edge_${methodDetail.name}_to_${className}`,
                    source: methodDetail.name,
                    target: className,
                    label: 'used in'
                });

                // Create nodes for each method in the class
                usages.forEach((usage, methodIndex) => {
                    // Position methods below their class
                    const methodX = classX + (methodIndex - (usages.length - 1) / 2) * (classSpacing * 0.5);
                    const methodY = classY + verticalSpacing;

                    const methodNodeId = `${className}.${usage}`;
                    nodes.push({
                        id: methodNodeId,
                        label: usage || 'Unknown Method',
                        size: 8,
                        color: '#4CAF50', // Method node color
                        x: methodX,
                        y: methodY,
                        type: 'method'
                    });

                    // Connect class to method
                    edges.push({
                        id: `edge_${usage}_to_${className}`,
                        source: className,
                        target: methodNodeId,
                        label: 'contains'
                    });
                });
            });
        }

        return { nodes, edges };
    }
} 