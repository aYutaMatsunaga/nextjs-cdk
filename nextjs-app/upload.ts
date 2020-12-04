import * as aws from 'aws-sdk'
import * as fs from 'fs'
import * as path from 'path'

const config = {
  s3BucketName: process.env.DEPLOY_BUCKET ?? '',
  folderPath: './out',
}

const s3 = new aws.S3()

const distFolderPath = path.join(__dirname, config.folderPath)

fs.readdir(distFolderPath, (_err, files) => {
  if (!files || files.length === 0) {
    console.log(`provided folder '${distFolderPath}' is empty or does not exist.`)
    console.log('Make sure your project was compiled!')
    return
  }

  for (const fileName of files) {
    const filePath = path.join(distFolderPath, fileName)

    // ignore if directory
    if (fs.lstatSync(filePath).isDirectory()) {
      continue
    }

    // read file contents
    fs.readFile(filePath, (error, fileContent) => {
      // if unable to read file contents, throw exception
      if (error) { throw error }

      // upload file to S3
      s3.putObject({
        Bucket: config.s3BucketName,
        Key: fileName,
        Body: fileContent,
      }, (_res) => {
        console.log(`Successfully uploaded '${fileName}'!`)
      })
    })
  }
})
