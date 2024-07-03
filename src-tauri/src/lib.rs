use draven::project::parser::{Module, Parser, RustItem};
use rand::Rng;
use serde::Serialize;
use std::{collections::HashMap, path::PathBuf};

#[derive(Debug, Serialize)]
struct Node {
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
    is_dragging: bool,
    color: String,
    label: String,
    id: usize,
}
impl Node {
    fn new(id: usize, label: String) -> Self {
        Self {
            id: id,
            x: 150.0 - rand::random::<f64>() * 300.0,
            y: 150.0 - rand::random::<f64>() * 300.0,
            vx: 0.0,
            vy: 0.0,
            is_dragging: false,
            color: get_random_color(),
            label: label,
        }
    }
}

#[derive(Debug, Serialize)]
struct Link {
    source: usize,
    target: usize,
}

#[derive(Debug, Serialize)]
struct GetNodesResponse {
    nodes: Vec<Node>,
    links: Vec<Link>,
}

fn get_random_color() -> String {
    let mut rng = rand::thread_rng();
    let hue: u16 = rng.gen_range(0..360);
    format!("hsl({}, 70%, 50%)", hue)
}

#[tauri::command]
fn get_nodes() -> Result<String, String> {
    let result_parser = Parser::new(PathBuf::from("C:/Users/Silco/Desktop/pulsar"));
    let mut parser = match result_parser {
        Ok(p) => p,
        Err(e) => return Err(e.to_string()),
    };
    let result_parsing = parser.parse_in_src(&PathBuf::from("lib.rs"));
    let module = match result_parsing {
        Ok(m) => m,
        Err(e) => return Err(e.to_string()),
    };

    // let nodes_count = traverse_module(&module, "project", &mut 0);

    // fn traverse_module(module: &Module, name: &str, counter: &mut usize) -> Node {
    //     *counter += 1;

    //     let mut node = Node::new(*counter, name.to_string());

    //     for (key, item) in module {
    //         if let RustItem::Module(sub_module) = item {
    //             let child_node = traverse_module(sub_module, key, counter);
    //             node.label.push_str(&child_node.label);
    //         }
    //     }

    //     node
    // }

    // log::debug!("{:#?}", parser.project_items);

    // let mut id = 1;
    // let nodes = parser
    //     .project_items
    //     .into_iter()
    //     .map(|item| {
    //         id += 1;
    //         Node::new(id, item.global_path)
    //     })
    //     .collect::<Vec<Node>>();

    // let mut node_map = HashMap::new();
    // for (index, node) in nodes.iter().enumerate() {
    //     node_map.insert(&node.label, index);
    // }

    // let mut links = Vec::new();

    // // Generate links based on common prefixes in global_path
    // for i in 0..nodes.len() {
    //     for j in (i + 1)..nodes.len() {
    //         let label_i = &nodes[i].label;
    //         let label_j = &nodes[j].label;
    //         if let Some(prefix_i) = label_i.split("::").next() {
    //             if let Some(prefix_j) = label_j.split("::").next() {
    //                 if prefix_i == prefix_j {
    //                     links.push(Link {
    //                         source: i,
    //                         target: j,
    //                     });
    //                 }
    //             }
    //         }
    //     }
    // }

    // TEMP
    let nodes = Vec::new();
    let links = Vec::new();

    let payload = GetNodesResponse { nodes, links };
    let response = serde_json::to_string(&payload).unwrap();
    Ok(response)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    ::std::env::set_var("RUST_LOG", "debug");
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_nodes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
