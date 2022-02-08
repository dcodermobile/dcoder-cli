const Yaml = require('yaml')

module.exports.getReadmeText = (blockYaml, blockId, title, description, lastReleaseVersion) => {
  let baseReadMeFileData = `# ${title}
[![Run On Dcoder](https://static-content.dcoder.tech/dcoder-assets/run-on-dcoder.svg)](https://code.dcoder.tech/feed/block/${blockId})

## Description
${description}

`

  if (lastReleaseVersion) {
    baseReadMeFileData += `## Version
${lastReleaseVersion}
`
  }

  const parsedBlockData = Yaml.parse(blockYaml)

  let inputMdText = '## Inputs\n'
  if (parsedBlockData && parsedBlockData.inputs && Array.isArray(parsedBlockData.inputs)) {
    parsedBlockData.inputs.forEach(inp => {
      inputMdText += `#### **${inp.name}**  *${inp.type}*\n${inp.description}\n`
    })
  }

  baseReadMeFileData += inputMdText + '\n'

  let outputMdText = '## Output\n'
  if (parsedBlockData && parsedBlockData.output && parsedBlockData.output.name) {
    outputMdText += `#### **${parsedBlockData.output.name}**  *${parsedBlockData.output.type}*\n${parsedBlockData.output.description}\n`
  }

  baseReadMeFileData += outputMdText + '\n'

  return baseReadMeFileData
}
