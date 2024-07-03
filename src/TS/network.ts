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
import { genRandomGraph, genPolygon } from "./network_generate.ts";

class NetworkCanvas extends HTMLCanvasElement {
	private context: CanvasRenderingContext2D = this.getContext("2d") as CanvasRenderingContext2D;
	private render_x: number = 0;
	private render_y: number = 0;
	private cursor_x: number = 0;
	private cursor_y: number = 0;
	nodes: Node[] = [];
	links: Link[] = [];

	// rendering - general
	private render_nodes: boolean = true;
	private nodeRadius: number = 7;
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
	private attractionForce: number = 0.001;
	private repulsionForce: number = 3000;
	private centerAttractionForce: number = 0.001;
	private forceMultiplier: number = 1;
	private forceEpsilon = 10;

	// general
	private scale: number = 1;
	private minScale: number = 0.1;
	private maxScale: number = 50;

	// time
	private lastUpdateTime: number = 0;
	private accumulatedTime: number = 0;
	private fixedTimeStep: number = 1000 / 60; // Fixed time step in milliseconds (e.g., 16.67ms for 60 FPS)

	constructor() {
		super();
	}

	connectedCallback() {
		// TEMP
		let { nodes, links } = genRandomGraph(10, 20);
		this.nodes = nodes;
		this.links = links;

		this.classList.add("network-canvas");

		addEventListener("resize", this.resizeAdjustCanvas.bind(this));
		addEventListener("contextmenu", (event) => event.preventDefault());
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
		removeEventListener("contextmenu", (event) => event.preventDefault());
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

	applyForces(deltaTime: number) {
		const dt = deltaTime;

		this.nodes.forEach((node) => (node.vx = node.vy = 0));

		this.links.forEach((link) => {
			const sourceNode = this.nodes.find(node => node.id === link.source);
			const targetNode = this.nodes.find(node => node.id === link.target);

			if (!sourceNode || !targetNode) return;

			const dx = targetNode.x - sourceNode.x;
			const dy = targetNode.y - sourceNode.y;
			const distance = Math.sqrt(dx * dx + dy * dy) + this.forceEpsilon;
			const force = this.attractionForce * distance * this.forceMultiplier;

			const ax = force * (dx / distance);
			const ay = force * (dy / distance);

			if (!sourceNode.isDragging) {
				sourceNode.vx += ax;
				sourceNode.vy += ay;
			}
			if (!targetNode.isDragging) {
				targetNode.vx -= ax;
				targetNode.vy -= ay;
			}
		});

		this.nodes.forEach((node, i) => {
			this.nodes.forEach((otherNode, j) => {
				if (i === j) return;
				const dx = node.x - otherNode.x;
				const dy = node.y - otherNode.y;
				const distance = Math.sqrt(dx * dx + dy * dy) + this.forceEpsilon;
				const force = (this.repulsionForce / (distance * distance)) * this.forceMultiplier;

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
			const distance = Math.sqrt(dx * dx + dy * dy) + this.forceEpsilon;
			const force = this.centerAttractionForce * distance * this.forceMultiplier;

			node.vx += force * (dx / distance);
			node.vy += force * (dy / distance);

			node.x += node.vx * dt;
			node.y += node.vy * dt;
		});
	}

	drawGrid() {
		this.context.strokeStyle = "transparent";
		this.context.lineWidth = this.gridLineWidth;
		this.context.fillStyle = this.gridColor;

		const gridSize = this.gridSize;
		const gridSizeScaled = gridSize * this.scale; // FIX modulo by 0?

		const startX = Math.floor(-this.render_x / gridSizeScaled) * gridSize;
		const startY = Math.floor(-this.render_y / gridSizeScaled) * gridSize;

		const endX = this.width / this.scale + startX + gridSize;
		const endY = this.height / this.scale + startY + gridSize;

		for (let x = startX; x < endX; x += gridSize) {
			for (let y = startY; y < endY; y += gridSize) {
				this.context.beginPath();
				this.context.arc(x, y, 1, 0, 2 * Math.PI);
				this.context.fill();
				this.context.stroke();
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
			const sourceNode = this.nodes.find(node => node.id === link.source);
			const targetNode = this.nodes.find(node => node.id === link.target);

			if (!sourceNode || !targetNode) return;

			const gradient = this.context.createLinearGradient(
				sourceNode.x,
				sourceNode.y,
				targetNode.x,
				targetNode.y
			);
			gradient.addColorStop(0, sourceNode.color);
			gradient.addColorStop(1, targetNode.color);

			this.context.lineWidth = this.linkWidth;
			this.context.strokeStyle = gradient;
			this.context.beginPath();
			this.context.moveTo(sourceNode.x, sourceNode.y);
			this.context.lineTo(targetNode.x, targetNode.y);
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
		const currentTime = performance.now();
		const deltaTime = currentTime - this.lastUpdateTime;
		this.lastUpdateTime = currentTime;
		this.accumulatedTime += deltaTime;

		while (this.accumulatedTime >= this.fixedTimeStep) {
			this.applyForces(this.fixedTimeStep);
			this.accumulatedTime -= this.fixedTimeStep;
		}

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
			if (event.button === 2) stop(); // TODO collapse 1 line
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

// TODO
// import { once } from '@tauri-apps/api/event';
// interface LoadedPayload {
// 	loggedIn: boolean,
// 	token: string;
// }
// const _unlisten = await once<LoadedPayload>('loaded', (event) => {
// 	console.log(`App is loaded, loggedIn: ${event.payload.loggedIn}, token: ${event.payload.token}`);
// });

// import { invoke } from "@tauri-apps/api/core";
// async function get_nodes() {
// 	let json: string = await invoke("get_nodes");
// 	let object = JSON.parse(json);
// 	let { nodes, links } = object;
// 	networkCanvas.nodes = nodes;
// 	networkCanvas.links = links;
// }
// get_nodes();
