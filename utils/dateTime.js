module.exports.convertToISOString = (dateTime) => {
  const tmpArray = dateTime.split('-')
  if (tmpArray.length > 1) {
    const offsetArray = tmpArray.pop().split('')
    let miliSeconds = null
    switch (offsetArray.pop()) {
      case 's':
        miliSeconds = 1000 * parseInt(offsetArray.join(''))
        return '${{ new Date(new Date() - ' + (miliSeconds < 60000 ? 60000 : miliSeconds) + ').toISOString() }}'
      case 'm':
        miliSeconds = 1000 * 60 * parseInt(offsetArray.join(''))
        return '${{ new Date(new Date() - ' + (miliSeconds < 60000 ? 60000 : miliSeconds) + ').toISOString() }}'
      case 'h':
        miliSeconds = 1000 * 60 * 60 * parseInt(offsetArray.join(''))
        return '${{ new Date(new Date() - ' + (miliSeconds < 60000 ? 60000 : miliSeconds) + ').toISOString() }}'
      case 'd':
        miliSeconds = 1000 * 60 * 60 * 24 * parseInt(offsetArray.join(''))
        return '${{ new Date(new Date() - ' + (miliSeconds < 60000 ? 60000 : miliSeconds) + ').toISOString() }}'
      case 'w':
        miliSeconds = 1000 * 60 * 60 * 24 * 7 * parseInt(offsetArray.join(''))
        return '${{ new Date(new Date() - ' + (miliSeconds < 60000 ? 60000 : miliSeconds) + ').toISOString() }}'
      case 'M':
        miliSeconds = 1000 * 60 * 60 * 24 * 30 * parseInt(offsetArray.join(''))
        return '${{ new Date(new Date() - ' + (miliSeconds < 60000 ? 60000 : miliSeconds) + ').toISOString() }}'
      case 'y':
        miliSeconds = 1000 * 60 * 60 * 24 * 365 * parseInt(offsetArray.join(''))
        return '${{ new Date(new Date() - ' + (miliSeconds < 60000 ? 60000 : miliSeconds) + ').toISOString() }}'
    }
  } else {
    return '${{ new Date().toISOString() }}'
  }
}
