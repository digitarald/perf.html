![Screenshot from June 24th, 2016](./screenshot-2016-06-24.png?raw=true)


Cleopatra
=========

Cleopatra is a webpage to visualize performance profiles. It was written to be used by the Gecko Profiler but can in theory be used by any profiler that can output to JSON. The UI runs entirely client-side.

Running
=======

This project is live on [https://new.cleopatra.io/](https://new.cleopatra.io/). In order to obtain profiles from Firefox, you need to install an add-on, which you can do by clicking the link on that website.

If you want to hack on cleopatra and run your own version locally, you need to point the add-on at your local instance:

 1. Go to `about:addons`.
 2. Find the Gecko Profiler add-on.
 3. Click Preferences.
 4. Change the value of the “Reporter URL” textbox to `http://localhost:4242/from-addon/`.

Then clone this repository and start your local cleopatra instance like this:

    $ # First, make sure you have somewhat recent versions of node and npm.
    $ # Then, clone this repository and check out this branch:
    $ git clone https://github.com/mstange/cleopatra.git
    $ cd cleopatra
    $ # Now, install the necessary node modules:
    $ npm install
    $ # Run webpack to process + bundle the JS, and start a local webserver at
    $ # localhost:4242:
    $ npm run start-prod

This builds and runs the production version.

Alternatively, you can run the development version. The development has lots of runtime checks and logging and is not minified. However, that means that it runs a lot slower.

To run the development version, run `npm run start` instead of `npm run start-prod`.

Development Docs
=======

The documentation for the project is just getting started, but it is located at [in the docs folder](./docs).
