{ pkgs, config, ... }:
{
  # https://devenv.sh/languages/
  languages = {
    php = {
      enable = true;
      version = "8.4";
      fpm.pools.web = {
        settings = {
          "pm" = "dynamic";
          "pm.max_children" = 5;
          "pm.start_servers" = 2;
          "pm.min_spare_servers" = 1;
          "pm.max_spare_servers" = 5;
        };
      };
    };
    javascript = {
      enable = true;
      npm = {
        enable = true;
        install.enable = true;
      };
    };
  };

  # https://devenv.sh/services/
  services.caddy = {
    enable = true;
    virtualHosts."http://localhost:8000" = {
      extraConfig = ''
        root * public
        php_fastcgi unix/${config.languages.php.fpm.pools.web.socket}
        file_server
      '';
    };
  };
}
