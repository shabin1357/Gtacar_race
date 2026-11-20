using UnityEngine;
using UnityEngine.Events;

namespace ProjectVelocity.UI
{
    /// <summary>
    /// Responsive multi-touch Android input bridge wired to UI Button EventTriggers:
    /// Left, Right, Accelerate, Brake, Handbrake, Nitro, Camera Switch, Map, and Pause.
    /// </summary>
    public class MobileControls : MonoBehaviour
    {
        public float Throttle { get; private set; }
        public float Brake { get; private set; }
        public float Steer => (_steerRight ? 1f : 0f) - (_steerLeft ? 1f : 0f);
        public bool Handbrake { get; private set; }
        public bool Nitro { get; private set; }

        [Header("HUD Action Callbacks")]
        public UnityEvent onCameraSwitch;
        public UnityEvent onToggleMap;
        public UnityEvent onTogglePause;

        private bool _steerLeft;
        private bool _steerRight;

        // Wire these methods to PointerDown / PointerUp on UI EventTrigger components
        public void SetSteerLeft(bool pressed) => _steerLeft = pressed;
        public void SetSteerRight(bool pressed) => _steerRight = pressed;
        public void SetThrottle(bool pressed) => Throttle = pressed ? 1f : 0f;
        public void SetBrake(bool pressed) => Brake = pressed ? 1f : 0f;
        public void SetHandbrake(bool pressed) => Handbrake = pressed;
        public void SetNitro(bool pressed) => Nitro = pressed;

        public void PressCameraSwitch() => onCameraSwitch?.Invoke();
        public void PressMapButton() => onToggleMap?.Invoke();
        public void PressPauseButton() => onTogglePause?.Invoke();

        public void ReleaseAllInputs()
        {
            _steerLeft = false;
            _steerRight = false;
            Throttle = 0f;
            Brake = 0f;
            Handbrake = false;
            Nitro = false;
        }
    }
}
