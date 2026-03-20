
# Getting Started with development

activate the development environment: 

``devenv shell``

start php web server: 

``php -S localhost:8080``

open 

http://localhost:8080/index.html


If you have any doubt, feel free to contact me at cvazeem@gmail.com

# Requirements
--
A simple webserver to serve the app.

Extract the files and place it in the root directory of your website.

# i. Sharemap.js
To share your public map via Facebook, do the following changes.

a. Create an App in facebook. Make sure your website is allowed as origin.

Open Sharemap.js and make the following changes.
a. Locate this line (number 28) and change https://www.facebook.com/dialog/feed?app_id=11111111&'
to app_id='With your facebook app id'

b. Change http://mindmapmaker.org/mind-map-maker.png (on line number 32) to your website
c. Change https://app.mindmapmaker.org (on line number 34) to your website

# ii. UrlShortener.js
To share map via 'bit.ly' make changes in js/UrlShortener.js
//Register for an account at bit.ly/a/sign_up
Change 'var username="";' (on line number 12) with your username from bit.ly
Change 'var actoken="";' (on line number 13) with your actoken from bit.ly

