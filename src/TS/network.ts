import "../SCSS/titlebar.scss";
import "../SCSS/network.scss";
let computedStyle = getComputedStyle(document.documentElement);
// let one = computedStyle.getPropertyValue("--one");
// let two = computedStyle.getPropertyValue("--two");
// let three = computedStyle.getPropertyValue("--three");
// let four = computedStyle.getPropertyValue("--four");
let five = computedStyle.getPropertyValue("--five");

import { Window } from "@tauri-apps/api/window";
let win = Window.getCurrent();
document.getElementById("titlebar-minimize")?.addEventListener("click", () => win.minimize());
document.getElementById("titlebar-maximize")?.addEventListener("click", () => win.toggleMaximize());
document.getElementById("titlebar-close")?.addEventListener("click", () => win.close());

import { Node, Link } from "./network_types.ts";
import { generateGraph, genPolygon, gen3DPolygon } from "./network_generate.ts";

class NetworkCanvas extends HTMLCanvasElement {
	private context: CanvasRenderingContext2D = this.getContext("2d") as CanvasRenderingContext2D;
	private render_x: number = 0;
	private render_y: number = 0;
	private cursor_x: number = 0;
	private cursor_y: number = 0;
	nodes: Node[] = [];
	links: Link[] = [];

	// rendering - general
	private render_nodes: boolean = false;
	private nodeRadius: number = 10;
	private linkWidth: number = 2.68;
	private draggedNodeColor: string = "white";
	private render_node_labels: boolean = true;
	private nodeFontFamily: string = "12px Fira Code";
	private nodeFontColor: string = "#fff";
	// rendering - grid
	private gridSize: number = 25;
	private gridColor = five;
	private gridLineWidth = 0.68;

	// physics
	private attractionForce: number = 0.168;
	private repulsionForce: number = 500;
	private centerAttractionForce: number = 0.01;

	// general
	private scale: number = 1;
	private minScale: number = 0.1;
	private maxScale: number = 10;

	constructor() {
		super();
		this.classList.add("network-canvas");
	}

	preventContextMenu = (event: MouseEvent) => event.preventDefault();

	connectedCallback() {
		const graph = generateGraph(1000, 1000);
		this.nodes = this.nodes.concat(graph.nodes);
		this.links = this.links.concat(graph.links);

		for (let i = 0; i <= 20; i++) {
			const { nodes, links } = genPolygon(i);
			this.nodes = this.nodes.concat(nodes);
			this.links = this.links.concat(links);
		}
		for (let i = 4; i <= 6; i++) {
			const { nodes, links } = gen3DPolygon(i);
			this.nodes = this.nodes.concat(nodes);
			this.links = this.links.concat(links);
		}

		addEventListener("resize", this.resizeAdjustCanvas.bind(this));
		addEventListener("contextmenu", this.preventContextMenu.bind(this));
		this.addEventListener("mousedown", this.mousedown.bind(this));
		addEventListener("mousemove", this.mousemove.bind(this));
		this.addEventListener("wheel", this.wheel.bind(this));
		this.resizeCanvas();
		this.centerCanvas();

		this.update_and_draw();
		setTimeout(() => { win.show(); }, 200);
	}

	disconnectedCallback() {
		removeEventListener("resize", this.resizeAdjustCanvas.bind(this));
		removeEventListener("contextmenu", this.preventContextMenu.bind(this));
		this.removeEventListener("mousedown", this.mousedown.bind(this));
		removeEventListener("mousemove", this.mousemove.bind(this));
		this.removeEventListener("wheel", this.wheel.bind(this));
	}

	centerCanvas() {
		this.render_x = this.width / 2;
		this.render_y = this.height / 2;
	}

	resizeCanvas() {
		this.width = innerWidth;
		this.height = innerHeight;
	}

	resizeAdjustCanvas() {
		let old_width = this.width;
		let old_height = this.height;
		this.resizeCanvas();
		this.render_x += (this.width - old_width) / 2;
		this.render_y += (this.height - old_height) / 2;
	}

	applyForces() {
		const epsilon = 5;

		this.nodes.forEach((node) => (node.vx = node.vy = 0));

		this.links.forEach((link) => {
			const dx = link.target.x - link.source.x;
			const dy = link.target.y - link.source.y;
			const distance = Math.sqrt(dx * dx + dy * dy) + epsilon;
			const force = this.attractionForce * distance;

			const ax = force * (dx / distance);
			const ay = force * (dy / distance);

			if (!link.source.isDragging) {
				link.source.vx += ax;
				link.source.vy += ay;
			}
			if (!link.target.isDragging) {
				link.target.vx -= ax;
				link.target.vy -= ay;
			}
		});

		this.nodes.forEach((node, i) => {
			this.nodes.forEach((otherNode, j) => {
				if (i === j) return;
				const dx = node.x - otherNode.x;
				const dy = node.y - otherNode.y;
				const distance = Math.sqrt(dx * dx + dy * dy) + epsilon;
				const force = this.repulsionForce / (distance * distance);

				const ax = force * (dx / distance);
				const ay = force * (dy / distance);

				if (node.isDragging) return;

				node.vx += ax;
				node.vy += ay;
			});
		});

		this.nodes.forEach((node) => {
			if (node.isDragging) return;
			const dx = -node.x;
			const dy = -node.y;
			const distance = Math.sqrt(dx * dx + dy * dy) + epsilon;
			const force = this.centerAttractionForce * distance;

			node.vx += force * (dx / distance);
			node.vy += force * (dy / distance);

			node.x += node.vx;
			node.y += node.vy;
		});
	}

	drawGrid() {
		this.context.strokeStyle = this.gridColor;
		this.context.lineWidth = this.gridLineWidth;

		const gridSize = this.gridSize;
		const gridSizeScaled = gridSize * this.scale; // FIX modulo by 0?

		// const startX = Math.floor(offsetX / gridSizeScaled) * gridSize;
		// const startY = Math.floor(offsetY / gridSizeScaled) * gridSize;

		// const amount_of_dots_x = this.width / gridSizeScaled;
		// const amount_of_dots_y = this.height / gridSizeScaled;

		// const startX = -this.render_x;
		// const startY = -this.render_y;

		const startX = Math.floor(-this.render_x / gridSizeScaled) * gridSize;
		const startY = Math.floor(-this.render_y / gridSizeScaled) * gridSize;

		// TEMP draw a red dot at start x and y for debugging
		// this.context.fillStyle = "red";
		// this.context.beginPath();
		// this.context.arc(startX, startY, 5, 0, 2 * Math.PI);
		// this.context.fill();
		// this.context.stroke();

		// -this.render_x
		// -this.render_y

		const endX = this.width / this.scale + startX + gridSize;
		const endY = this.height / this.scale + startY + gridSize;

		for (let x = startX; x < endX; x += gridSize) {
			for (let y = startY; y < endY; y += gridSize) {
				// Grid Dots
				this.context.beginPath();
				this.context.arc(x, y, 1, 0, 2 * Math.PI);
				this.context.fill();
				this.context.stroke();

				// Grid lines
				// this.context.beginPath();
				// this.context.moveTo(x, startY);
				// this.context.lineTo(x, endY);
				// this.context.stroke();
				// this.context.beginPath();
				// this.context.moveTo(startX, y);
				// this.context.lineTo(endX, y);
				// this.context.stroke();
			}
		}
	}

	render() {
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.save();
		this.context.scale(this.scale, this.scale);
		this.context.translate(this.render_x / this.scale, this.render_y / this.scale);

		this.drawGrid();

		this.links.forEach((link) => {
			const gradient = this.context.createLinearGradient(
				link.source.x,
				link.source.y,
				link.target.x,
				link.target.y
			);
			gradient.addColorStop(0, link.source.color);
			gradient.addColorStop(1, link.target.color);

			this.context.lineWidth = this.linkWidth;
			this.context.strokeStyle = gradient;
			this.context.beginPath();
			this.context.moveTo(link.source.x, link.source.y);
			this.context.lineTo(link.target.x, link.target.y);
			this.context.stroke();
		});

		if (this.render_nodes)
			this.nodes.forEach((node) => {
				this.context.fillStyle = node.color;
				this.context.beginPath();
				this.context.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
				this.context.fill();
			});

		if (this.render_node_labels)
			this.nodes.forEach((node) => {
				this.context.font = this.nodeFontFamily;
				this.context.fillStyle = this.nodeFontColor;
				this.context.fillText(
					node.label,
					node.x + this.nodeRadius + 2,
					node.y + this.nodeRadius / 2
				);
			});

		this.context.restore();
	}

	update_and_draw() {
		this.applyForces();
		this.render();
		requestAnimationFrame(this.update_and_draw.bind(this));
	}

	mousedown(event: MouseEvent) {
		const x = this.cursor_x;
		const y = this.cursor_y;
		event.preventDefault();
		switch (event.button) {
			case 0:
				this.dragging(x, y);
				break;
			case 2:
				this.panning(x, y);
				break;
		}
	}

	mousemove(event: MouseEvent) {
		const rect = this.getBoundingClientRect();
		this.cursor_x = (event.clientX - rect.left - this.render_x) / this.scale;
		this.cursor_y = (event.clientY - rect.top - this.render_y) / this.scale;
	}

	dragging(down_x: number, down_y: number) {
		let dragged_node = this.nodes.find((node) => {
			const dx = node.x - down_x;
			const dy = node.y - down_y;
			return Math.sqrt(dx * dx + dy * dy) < this.nodeRadius;
		});
		if (!dragged_node) return;
		dragged_node.isDragging = true;
		let original_node_color = dragged_node.color;
		dragged_node.color = this.draggedNodeColor;

		const mousemove = () => {
			dragged_node.x = this.cursor_x;
			dragged_node.y = this.cursor_y;
		};
		const stop = () => {
			dragged_node.isDragging = false;
			dragged_node.color = original_node_color;
			removeEventListener("mousemove", mousemove);
			removeEventListener("mouseup", mouseup);
			removeEventListener("blur", stop);
		};
		const mouseup = (event: MouseEvent) => event.button === 0 && stop();
		addEventListener("mousemove", mousemove);
		addEventListener("mouseup", mouseup);
		addEventListener("blur", stop);
	}

	panning(down_x: number, down_y: number) {
		const mousemove = () => {
			this.render_x += (this.cursor_x - down_x) * this.scale;
			this.render_y += (this.cursor_y - down_y) * this.scale;
		};
		const mouseup = (event: MouseEvent) => {
			if (event.button === 2) stop();
		};
		const stop = () => {
			removeEventListener("mousemove", mousemove);
			removeEventListener("mouseup", mouseup);
			removeEventListener("blur", stop);
		};
		addEventListener("mousemove", mousemove);
		addEventListener("mouseup", mouseup);
		addEventListener("blur", stop);
	}

	wheel(event: WheelEvent) {
		const zoomIntensity = 0.1;
		const wheel = event.deltaY < 0 ? 1 : -1;
		const zoom = Math.exp(wheel * zoomIntensity);

		const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoom));

		const scaleChange = newScale / this.scale;
		this.scale = newScale;

		this.render_x = this.cursor_x - (this.cursor_x - this.render_x) * scaleChange;
		this.render_y = this.cursor_y - (this.cursor_y - this.render_y) * scaleChange;

		event.preventDefault();
	}
}
customElements.define("network-canvas", NetworkCanvas, { extends: "canvas" });

let networkCanvas = new NetworkCanvas();
document.body.appendChild(networkCanvas);
