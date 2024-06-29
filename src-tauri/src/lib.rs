use draven::project::parser::Parser;
use log::debug;
use std::path::PathBuf;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    ::std::env::set_var("RUST_LOG", "debug");
    env_logger::init();

    let mut parser = Parser::new(PathBuf::from("C:/Users/Silco/Desktop/pulsar"))?;
    parser.parse_in_src(&PathBuf::from("lib.rs"))?;
    debug!("{:#?}", parser);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
