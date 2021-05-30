using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Helpers
{
    public class JwtBearerAuthenticationOptions : AuthenticationSchemeOptions
    {

    }

    public class CustomAuthenticationHandler : AuthenticationHandler<JwtBearerAuthenticationOptions>
    {
        private readonly IConfiguration _configuration;
        private readonly string EXTENSION_SIGNING_KEY;

        public CustomAuthenticationHandler(
            IOptionsMonitor<JwtBearerAuthenticationOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock,
            IConfiguration configuration)
            : base(options, logger, encoder, clock)
        {
            _configuration = configuration;
            EXTENSION_SIGNING_KEY = _configuration.GetValue<string>("extensionSigningKey");
        }

#pragma warning disable 1998
        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.ContainsKey("Authorization"))
                return AuthenticateResult.Fail("Unauthorized");

            string authorizationHeader = Request.Headers["Authorization"];
            if (string.IsNullOrEmpty(authorizationHeader))
            {
                return AuthenticateResult.NoResult();
            }

            if (authorizationHeader.StartsWith("bearer", StringComparison.OrdinalIgnoreCase))
            {
                string token = authorizationHeader.Substring("bearer".Length).Trim();

                if (string.IsNullOrEmpty(token))
                {
                    return AuthenticateResult.Fail("Unauthorized");
                }

                try
                {
                    return validateToken(token);
                }
                catch (Exception ex)
                {
                    return AuthenticateResult.Fail(ex.Message);
                }
            }
            else
            {
                return AuthenticateResult.Fail("Unauthorized");
            }
        }
#pragma warning restore 1998

        private AuthenticateResult validateToken(string token)
        {
            TokenValidationParameters validationParameters = new TokenValidationParameters
            {
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(EXTENSION_SIGNING_KEY)),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateActor = false,
                RequireSignedTokens = true,
                RequireExpirationTime = true,
                ValidateLifetime = true
            };

            SecurityToken securityToken;
            var jwtHandler = new JwtSecurityTokenHandler();
            try
            {
                var claimsPrincipal = jwtHandler.ValidateToken(token, validationParameters, out securityToken);
                return AuthenticateResult.Success(new AuthenticationTicket(claimsPrincipal, new AuthenticationProperties(), "custom"));
            }
            catch (SecurityTokenValidationException stex)
            {
                return AuthenticateResult.Fail(stex.Message);
            }
        }
    }
}