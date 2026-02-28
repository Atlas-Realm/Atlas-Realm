use sysinfo::{PidExt, ProcessExt, System, SystemExt};
use crate::models::ProcessInfo;

pub struct SystemScanner {
    sys: System,
}

impl SystemScanner {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let mut sys = System::new();
        sys.refresh_processes();
        Ok(Self { sys })
    }

    pub fn get_running_processes(&mut self) -> Result<Vec<ProcessInfo>, Box<dyn std::error::Error>> {
        self.sys.refresh_processes();
        
        let processes = self.sys.processes();
        let mut result = Vec::with_capacity(processes.len());
        
        for (pid, process) in processes {
            result.push(ProcessInfo {
                name: process.name().to_string(),
                pid: pid.as_u32(),
            });
        }
        
        Ok(result)
    }
}
