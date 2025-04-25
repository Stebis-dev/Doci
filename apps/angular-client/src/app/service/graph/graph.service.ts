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

        // Add the main method as the central node
        nodes.push({
            id: methodDetail.name,
            label: methodDetail.name,
            size: 12,
            color: '#E91E63', // Primary node color
            x: 0,
            y: 0
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
                const methodUsedIn = usage.methodUsedIn
                if (methodUsedIn) {
                    const uniqueMethods = classGroups.get(classKey);
                    uniqueMethods?.push(methodUsedIn);
                    classGroups.set(classKey, Array.from(new Set(uniqueMethods)));
                }
            });
            console.log('Class Groups:', classGroups);
            // console.log('Method Detail:', methodDetail);
            // console.log('Method Detail Used In:', methodDetail.usedIn);

            // Create nodes and edges for each class and its methods
            Array.from(classGroups.entries()).forEach(([className, usages], classIndex) => {
                const classAngle = (1 * Math.PI * classIndex) / classGroups.size;
                const classRadius = 0.25;

                // Create class node
                nodes.push({
                    id: className,
                    label: className,
                    size: 10,
                    color: '#2196F3', // Class node color
                    x: Math.sin(classAngle) * classRadius,
                    y: - (Math.cos(classAngle) * classRadius),
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
                    const methodAngle = (methodIndex - (usages.length - 1) / 2) * 0.3; // Spread methods in an arc
                    const methodRadius = classRadius * 0.5;

                    const methodNodeId = `${className}.${usage}`;
                    nodes.push({
                        id: methodNodeId,
                        label: usage || 'Unknown Method',
                        size: 8,
                        color: '#4CAF50', // Method node color
                        x: (Math.sin(methodAngle) * classRadius),
                        y: - (Math.cos(methodAngle) * classRadius),
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