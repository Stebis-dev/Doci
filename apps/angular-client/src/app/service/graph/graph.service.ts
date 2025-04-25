import { Injectable } from '@angular/core';
import { MethodDetail, MethodsUsedDetail } from '@doci/shared';

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
            id: 'main',
            label: methodDetail.name,
            size: 15,
            color: '#E91E63', // Primary node color
            x: 0,
            y: 0
        });

        // Process usedIn relationships
        if (methodDetail.usedIn && methodDetail.usedIn.length > 0) {
            console.log(methodDetail.usedIn);

            methodDetail.usedIn.forEach((usage: MethodsUsedDetail, index: number) => {
                const angle = (2 * Math.PI * index) / methodDetail.usedIn!.length;
                const radius = 100;

                // Create node for the class/object that uses this method
                const classNodeId = `class_${usage.classUsedIn}`;
                if (!nodes.some(node => node.id === classNodeId)) {
                    nodes.push({
                        id: classNodeId,
                        label: usage.classUsedIn || usage.objectType || 'Unknown Class',
                        size: 10,
                        color: '#2196F3', // Class node color
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius
                    });
                }

                // Create node for the method that uses this method
                const methodNodeId = `method_${usage.classUsedIn}_${usage.methodUsedIn}`;
                if (!nodes.some(node => node.id === methodNodeId)) {
                    nodes.push({
                        id: methodNodeId,
                        label: usage.methodUsedIn || 'Unknown Method',
                        size: 7,
                        color: '#4CAF50', // Method node color
                        x: Math.cos(angle) * (radius * 1.5),
                        y: Math.sin(angle) * (radius * 1.5)
                    });
                }
                const classEdgeId = `edge_class_${usage.classUsedIn}`;
                if (!edges.some(node => node.id === classEdgeId)) {
                    // Create edges
                    edges.push({
                        id: classEdgeId,
                        source: 'main',
                        target: classNodeId,
                        label: 'used in'
                    });
                }

                const methodEdgeId = `edge_method_${usage.classUsedIn}_${usage.methodUsedIn}`;
                if (!edges.some(node => node.id === methodEdgeId)) {
                    edges.push({
                        id: methodEdgeId,
                        source: classNodeId,
                        target: methodNodeId,
                        label: 'method'
                    });
                }
            });
        }

        return { nodes, edges };
    }
} 