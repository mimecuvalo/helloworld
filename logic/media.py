import mimetypes

def detect_media_type(filename):
  if filename.endswith('.webm'):  # lamesauce
    return 'video'

  mimetype = mimetypes.guess_type(filename)[0]

  if not mimetype:
    return None
  if mimetype.find('video/') == 0:
    return 'video'
  elif mimetype.find('image/') == 0:
    return 'image'
  elif mimetype.find('audio/') == 0:
    return 'audio'
  else:
    return None

def generate_html(handler, filename, alt_text=''):
  media_type = detect_media_type(filename)
  mimetype = mimetypes.guess_type(filename)[0]

  if filename.endswith('.webm'):  # lamesauce
    mimetype = 'video/webm'

  if media_type == 'image':
    return '<img src="' + filename + '" alt="' + alt_text + '">'
  elif media_type == 'video':
    return '<video controls alt="' + alt_text + '" width="500">' \
         +   '<source src="' + filename + '" type="' + mimetype + '" onerror="hw.videoError(this)" >' \
         + '</video>'
  elif media_type == 'audio':
    return '<audio controls alt="' + alt_text + '">' \
         +   '<source src="' + filename + '" type="' + mimetype + '" onerror="hw.audioError(this)" >' \
         + '</audio>'
  else:
    return filename 
