import { Component, Input, OnInit, ElementRef, ViewChild, OnDestroy, SimpleChanges, OnChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Graph from 'graphology';
import Sigma from 'sigma';
import { MethodDetail } from '@doci/shared';
import { GraphService, GraphData } from '../../service/graph/graph.service';

@Component({
    selector: 'app-method-graph',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './method-graph.component.html',
})
export class MethodGraphComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
    @Input() methodDetail: MethodDetail | null = null;
    @ViewChild('container', { static: true }) container!: ElementRef;

    private sigma: Sigma | null = null;
    private graph: Graph;

    constructor(private graphService: GraphService) {
        this.graph = new Graph();
    }

    ngOnInit() {
        // Initialize Sigma
        this.sigma = new Sigma(this.graph, this.container.nativeElement, {
            minCameraRatio: 0.1,
            maxCameraRatio: 5,
            renderEdgeLabels: true
        });
    }

    ngAfterViewInit() {
        this.renderUsageDiagram();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['methodDetail']) {
            this.renderUsageDiagram();
        }
    }

    ngOnDestroy() {
        if (this.sigma) {
            this.sigma.kill();
        }
    }

    private renderUsageDiagram() {
        if (!this.methodDetail) return;

        const graphData: GraphData = this.graphService.generateMethodUsageGraph(this.methodDetail);

        console.log('Graph Data:', graphData);

        // Clear existing graph data
        this.graph.clear();
        // Add nodes to the graph
        graphData.nodes.forEach(node => {
            this.graph.addNode(node.id, {
                x: node.x,
                y: node.y,
                size: node.size,
                color: node.color,
                label: node.label,
                labelColor: "#fff"
            });
        });

        // Add edges to the graph
        graphData.edges.forEach(edge => {
            this.graph.addEdge(edge.source, edge.target, {
                id: edge.id,
                label: edge.label
            });
        });
        if (this.sigma) {
            this.sigma.refresh();
        }
    }
} 