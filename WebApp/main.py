import webapp2
import socket
import jinja2
import os

from paste.urlparser import StaticURLParser
from paste.cascade import Cascade
from paste import httpserver
from wifi import Cell
from subprocess import check_output

class HelloWebapp2(webapp2.RequestHandler):
    def get(self): 
        template_path = jinja2.FileSystemLoader( os.getcwd() + "/templates" ) 
        template_env = jinja2.Environment( loader=template_path )
        template = template_env.get_template('index.html')
        
        ssid = get_ssid()

        _context = { 
            "module": __name__,
            "ssid_list": Cell.all('wlan0'),
            "ssid": ssid
        }
        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(_context))
        
def get_ssid():
    wlan0 = check_output( ["iwconfig", "wlan0"] )
    w = wlan0.split()
    for l in wlan0.split():
        if l.startswith( 'ESSID' ):
            o = l.split(':')
            if len(o) == 2:
                if o[1].startswith('"') and o[1].endswith('"'):
                    o[1] = o[1][1:-1]
                return o[1]
    return ""        

class SettingPage(webapp2.RequestHandler):
    def get(self): 
        template_path = jinja2.FileSystemLoader( os.getcwd() + "/templates" ) 
        template_env = jinja2.Environment( loader=template_path )
        template = template_env.get_template('setting.html')
        
        ssid = get_ssid()

        _context = { 
            "module": __name__,
            "ssid_list": Cell.all('wlan0'),
            "ssid": ssid
        }
        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(_context))
        
    def post(self):
        ssid = self.request.get( 'ssid' )
        password = self.request.get( 'pass' )
        
        template_path = jinja2.FileSystemLoader( os.getcwd() + "/templates" ) 
        template_env = jinja2.Environment( loader=template_path )
        template = template_env.get_template('wpa_supplicant.conf')
        
        _context = { 
            "module": __name__,
            "ssid": ssid,
            "password": password
        }
        conf = template.render(_context)
        
        text_file = open("/boot/wpa_supplicant.conf", "w")
        text_file.write(conf)
        text_file.close()        
        
        self.response.headers['Content-Type'] = 'text/html'
        self.response.write( "<html><body><a href='/reboot'>Reboot</a></body></html>" )
        
class NodeRedHandler( webapp2.RequestHandler ):
    def get(self):
        self.redirect( self.request.host_url + ':1880' );
                
class RebootHandler( webapp2.RequestHandler):
    def get(self):
        os.system("reboot")
        
class HaltHandler( webapp2.RequestHandler):
    def get(self):
        os.system("halt")
        
web_app = webapp2.WSGIApplication([
    ('/setting', SettingPage),
    ('/reboot', RebootHandler),
    ('/restart', RebootHandler),
    ('/halt', HaltHandler),
    ('/shutdown', HaltHandler),
    ('/nodered', NodeRedHandler ),
    ('/', HelloWebapp2),
], debug=True)

# Create an app to serve static files
# Choose a directory separate from your source (e.g., "static/") so it isn't dl'able
static_app = StaticURLParser("static/")

# Create a cascade that looks for static files first, then tries the webapp
app = Cascade([static_app, web_app])

def main():
    from paste import httpserver
    httpserver.serve(app, host='0.0.0.0', port='80')

if __name__ == '__main__':
    main()

