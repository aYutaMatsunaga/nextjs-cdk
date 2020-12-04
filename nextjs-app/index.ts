import { spawn } from 'child_process'

export const handler = () => {
    console.log('Starting build...')
    
    const build = spawn('bash', ['build.sh'])
    
    build.stdout.on('data', (data) => {
      console.log('stdout: ' + data.toString())
    })
    
    build.stderr.on('data', (data) => {
      console.log('stderr: ' + data.toString())
    })
    
    build.on('exit', (code) => {
      console.log('child process exited with code ' + code!.toString())
    })
}